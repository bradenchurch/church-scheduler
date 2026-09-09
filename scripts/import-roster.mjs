#!/usr/bin/env node
// import-roster.mjs — verbose-logging wrapper around the roster importers.
//
// Usage:
//   node scripts/import-roster.mjs <file> [--dry-run] [--verbose] [--limit N]
//
//   <file>    roster file to import. Type is detected by extension:
//               .pdf  → LCR "Ministering Assignments" PDF  (server/lcr-parser.js)
//               .csv  → ward directory / roster CSV       (Companion 1, Companion 2,
//                        Assigned Leader / District, Companion 1 Email, Companion 2 Email)
//               .json → roster JSON: a parse-pdf preview ({ districts: [...] }),
//                        a { csv: "..." } payload, or a bare array of row objects
//                        ({ companion1_name, companion2_name, leader, ... })
//             Unknown extensions are sniffed (%PDF → PDF, [/{ → JSON, else CSV).
//
//   --dry-run  parse + validate every record, log everything, write NOTHING.
//   --verbose  extra debug output (raw headers, per-page parse notes, ...).
//   --limit N  process only the first N records.
//
// Behavior:
//   * Every step is timestamped to stdout AND logs/import-<ISO>.log.
//   * Record-level operations are wrapped in try/catch — a failing record is
//     logged with row context and processing CONTINUES.
//   * A structured summary is written to logs/import-<ISO>-summary.json.
//   * Real imports (no --dry-run) are written through the app's own admin
//     endpoints (booted locally with MOCK_AUTH, like scripts/smoke-*.sh), so
//     matching/upsert semantics stay identical to the admin UI.
//
// Exit codes: 0 = clean (warnings ok) · 1 = one or more records errored ·
//             2 = input file missing/unreadable.
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { parseLcrPdf } from '../server/lcr-parser.js';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = { dryRun: false, verbose: false, limit: null };
const positional = [];
for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === '--dry-run') flags.dryRun = true;
  else if (a === '--verbose') flags.verbose = true;
  else if (a === '--limit') {
    const n = Number(args[i + 1]);
    if (!Number.isFinite(n) || n < 1) {
      console.error('--limit requires a positive integer');
      process.exit(2);
    }
    flags.limit = Math.floor(n);
    i += 1;
  } else if (a.startsWith('--limit=')) {
    const n = Number(a.slice('--limit='.length));
    if (!Number.isFinite(n) || n < 1) {
      console.error('--limit requires a positive integer');
      process.exit(2);
    }
    flags.limit = Math.floor(n);
  } else if (a === '--help' || a === '-h') {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 30).join('\n'));
    process.exit(0);
  } else {
    positional.push(a);
  }
}

if (positional.length !== 1) {
  console.error('Usage: node scripts/import-roster.mjs <file> [--dry-run] [--verbose] [--limit N]');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Logger (stdout + log file)
// ---------------------------------------------------------------------------
const logDir = path.join(process.cwd(), 'logs');
fs.mkdirSync(logDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = path.join(logDir, `import-${stamp}.log`);
const summaryPath = path.join(logDir, `import-${stamp}-summary.json`);
const logLines = [];

function ts() {
  return new Date().toISOString();
}
function writeLine(level, msg) {
  const line = `[${ts()}] [${level}] ${msg}`;
  logLines.push(line);
  process.stdout.write(`${line}\n`);
}
const log = (msg) => writeLine('info', msg);
const verbose = (msg) => { if (flags.verbose) writeLine('debug', msg); };
const warn = (msg) => writeLine('warn', msg);
const err = (msg) => writeLine('error', msg);

// Summary accumulator (shape documented in the task + header comment).
const summary = {
  input_file: '',
  started_at: new Date().toISOString(),
  finished_at: null,
  duration_ms: null,
  totals: { parsed: 0, imported: 0, skipped: 0, errored: 0 },
  errors: [],
  warnings: [],
  exit_code: 0,
};
function recordError({ row = null, field = null, message, context = null } = {}) {
  summary.totals.errored += 1;
  summary.errors.push({ row, field, message, context });
  err(`record error row=${row} field=${field || '-'} :: ${message}${context ? ` (${context})` : ''}`);
}
function recordWarning(message) {
  summary.warnings.push(message);
  warn(message);
}

// ---------------------------------------------------------------------------
// Env bootstrap (secrets file first, repo .env fallback). Values never printed.
// ---------------------------------------------------------------------------
function loadEnv() {
  const candidates = [
    path.join(os.homedir(), '.openclaw', 'workspace', '.secrets', 'church-scheduler.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const f of candidates) {
    try {
      const txt = fs.readFileSync(f, 'utf8');
      const out = {};
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
      if (out.SUPABASE_URL && out.SUPABASE_ANON_KEY) {
        verbose(`loaded env from ${f}`);
        return out;
      }
    } catch {
      // try next candidate
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// CSV helpers (mirror server/index.js so local validation matches the server)
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text ?? '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  }
  return rows;
}

function normName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectColumns(headerRow) {
  const cols = { companion1_name: -1, companion2_name: -1, companion1_email: -1, companion2_email: -1, leader: -1 };
  headerRow.forEach((raw, i) => {
    const n = normName(raw);
    if (!n) return;
    if (n.includes('email')) {
      if (/1|first/.test(n) && !/2|second/.test(n)) cols.companion1_email = i;
      else if (/2|second/.test(n)) cols.companion2_email = i;
      else if (cols.companion1_email === -1) cols.companion1_email = i;
      else cols.companion2_email = i;
      return;
    }
    if (n.includes('leader') || n.includes('district') || n.includes('assigned')) { cols.leader = i; return; }
    if (n.includes('companion') || n.includes('elder') || n.includes('member') || n.includes('name')) {
      if (/1|first/.test(n) && !/2|second/.test(n)) cols.companion1_name = i;
      else if (/2|second/.test(n)) cols.companion2_name = i;
      else if (cols.companion1_name === -1) cols.companion1_name = i;
      else cols.companion2_name = i;
    }
  });
  return cols;
}

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const CANONICAL_CSV_HEADER = 'Companion 1,Companion 2,Assigned Leader / District,Companion 1 Email,Companion 2 Email';
const ROW_TO_CSV = (r) => [r.companion1_name, r.companion2_name, r.leader, r.companion1_email, r.companion2_email]
  .map(csvCell).join(',');

// ---------------------------------------------------------------------------
// Type detection
// ---------------------------------------------------------------------------
function detectType(filePath, buffer) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  const head = buffer.slice(0, 1024).toString('utf8').trimStart();
  if (buffer.slice(0, 4).toString('ascii') === '%PDF') return 'pdf';
  if (head.startsWith('{') || head.startsWith('[')) return 'json';
  return 'csv'; // lenient default: try structured-text / CSV parsing
}

// ---------------------------------------------------------------------------
// Local server boot (MOCK_AUTH, mirroring scripts/smoke-*.sh) — used only for
// real (non-dry-run) DB writes so upsert semantics match the admin UI.
// ---------------------------------------------------------------------------
const ADMIN_MOCK = JSON.stringify({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'braden@example.com',
  role: 'admin',
  leader_id: 'braden',
});

async function withServer(fn) {
  const env = loadEnv();
  const port = 3100 + Math.floor(Math.random() * 900);
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      MOCK_AUTH: 'true',
      NODE_ENV: 'development',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderrBuf = '';
  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });
  let healthy = false;
  for (let i = 0; i < 50; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) { healthy = true; break; }
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!healthy) {
    child.kill('SIGTERM');
    throw new Error(`Local import server failed to start: ${stderrBuf.slice(-500)}`);
  }
  try {
    return await fn(base);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      const t = setTimeout(() => resolve(), 3000);
      child.on('exit', () => { clearTimeout(t); resolve(); });
    });
  }
}

async function postJson(base, url, body, label) {
  const res = await fetch(`${base}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mock-User': ADMIN_MOCK },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
  if (!res.ok) {
    throw new Error(`${label} failed (HTTP ${res.status}): ${data?.error || JSON.stringify(data)}`);
  }
  return data;
}

async function postCsv(base, csvText, label) {
  const res = await fetch(`${base}/api/admin/import-roster`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv', 'X-Mock-User': ADMIN_MOCK },
    body: csvText,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
  if (!res.ok) {
    throw new Error(`${label} failed (HTTP ${res.status}): ${data?.error || JSON.stringify(data)}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Record sources: each returns { rows: [mapped record], kind } where a mapped
// record for CSV/JSON carries the ROW_TO_CSV fields and pdf rows are the
// preview's district payloads.
// ---------------------------------------------------------------------------
function parsePdfRecords(buffer, fileName) {
  verbose(`parsing PDF buffer (${buffer.length} bytes)…`);
  return parseLcrPdf(buffer, fileName);
}

async function collectPdfRows(buffer, fileName) {
  let preview;
  try {
    preview = await parsePdfRecords(buffer, fileName);
  } catch (e) {
    recordError({ field: 'pdf.parse', message: e.message, context: path.basename(fileName) });
    return { districts: null, preview: null };
  }
  const { districts, totals, warnings } = preview;
  log(`LCR PDF parsed: ward="${preview.ward_name || '?'}" districts=${totals.districts} companionships=${totals.companionships} families=${totals.families} warnings=${totals.warnings}`);
  for (const w of warnings || []) {
    recordWarning(`parser: ${w.message} (district ${w.district})`);
  }
  const rows = [];
  for (const district of districts || []) {
    for (const comp of district.companionships || []) {
      rows.push({
        kind: 'pdf',
        district_number: district.district,
        leader: district.leader,
        companion1_name: comp.companion_1?.name || '',
        companion2_name: comp.companion_2?.name || '',
        families: comp.families || [],
        label: `D${district.district} ${comp.companion_1?.name || '?'}${comp.companion_2 ? ` ↔ ${comp.companion_2.name}` : ''} (${(comp.families || []).length} fam)`,
      });
    }
  }
  return { rows, districts, preview };
}

function mapCsvRows(text) {
  const parsed = parseCsv(text);
  verbose(`CSV parsed: ${parsed.length} non-blank rows`);
  if (parsed.length === 0) {
    recordError({ field: 'csv.parse', message: 'CSV contained no data rows.' });
    return { rows: [], columns: null, header: null };
  }
  const first = parsed[0];
  const looksLikeHeader = first.some((c) => /companion|elder|member|leader|district|assigned|email|name/i.test(String(c)));
  let columns;
  let dataRows;
  if (!looksLikeHeader) {
    // Positional fallback: Companion 1, Companion 2, Leader/District, C1 Email, C2 Email
    const n = first.length;
    columns = {
      companion1_name: n > 0 ? 0 : -1, companion2_name: n > 1 ? 1 : -1, leader: n > 2 ? 2 : -1,
      companion1_email: n > 3 ? 3 : -1, companion2_email: n > 4 ? 4 : -1,
    };
    dataRows = parsed;
    verbose(`no header detected — using positional columns (${n} cols)`);
  } else {
    columns = detectColumns(first);
    dataRows = parsed.slice(1);
    verbose(`header detected: ${JSON.stringify(first)} -> ${JSON.stringify(columns)}`);
    if (columns.companion1_name === -1 && columns.companion2_name === -1) {
      verbose('no Companion/Elder/Member/Name column — falling back to positional columns 0/1');
      columns.companion1_name = 0;
      columns.companion2_name = 1;
      if (columns.leader === -1) columns.leader = 2;
      if (columns.companion1_email === -1) columns.companion1_email = 3;
      if (columns.companion2_email === -1) columns.companion2_email = 4;
    }
  }
  if (columns.companion1_name === -1 && columns.companion2_name === -1) {
    recordError({ field: 'csv.columns', message: 'CSV has no Companion/name column — nothing to import.' });
    return { rows: [], columns, header: first };
  }

  const cell = (row, idx) => (idx === -1 || idx == null ? '' : String(row[idx] ?? '').trim());
  const rows = [];
  dataRows.forEach((r, i) => {
    // dataRows[0] is the first record; keep the original file line for context.
    const rawLine = first === parsed[0] && !looksLikeHeader ? i + 1 : i + 2;
    const mapped = {
      kind: 'csv',
      file_line: rawLine,
      companion1_name: cell(r, columns.companion1_name),
      companion2_name: cell(r, columns.companion2_name),
      leader: cell(r, columns.leader),
      companion1_email: cell(r, columns.companion1_email),
      companion2_email: cell(r, columns.companion2_email),
      label: `${cell(r, columns.companion1_name) || '(no companion 1)'}${cell(r, columns.companion2_name) ? ` ↔ ${cell(r, columns.companion2_name)}` : ''}`,
    };
    if (!mapped.companion1_name) {
      mapped.reason = 'no companion 1 name';
      mapped.skip = true;
    }
    rows.push(mapped);
  });
  return { rows, columns, header: looksLikeHeader ? first : null };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const filePath = path.resolve(positional[0]);
  summary.input_file = filePath;
  log(`import-roster wrapper start (dry-run=${flags.dryRun}, verbose=${flags.verbose}, limit=${flags.limit ?? 'all'})`);
  log(`input file: ${filePath}`);

  // 1. Read file
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
    log(`file readable: ${buffer.length} bytes`);
  } catch (e) {
    summary.finished_at = new Date().toISOString();
    summary.exit_code = 2;
    writeSummaryFile();
    err(`cannot read input file: ${e.message}`);
    process.exit(2);
  }

  const type = detectType(filePath, buffer);
  log(`detected import type: ${type.toUpperCase()} (${path.extname(filePath) || 'no extension'})`);

  // 2. Parse phase → record list (record-level try/catch, continue on error)
  let records = [];
  let dryPayload = null; // parsed structure reused for the write phase

  if (type === 'pdf') {
    const { rows, districts } = await collectPdfRows(buffer, filePath);
    records = rows;
    dryPayload = districts;
  } else if (type === 'json') {
    let json;
    try {
      json = JSON.parse(buffer.toString('utf8'));
      log(`JSON parsed: ${Array.isArray(json) ? 'array of row objects' : Object.keys(json).join(', ')}`);
    } catch (e) {
      recordError({ field: 'json.parse', message: `invalid JSON: ${e.message}` });
      records = [];
    }
    if (json) {
      if (Array.isArray(json)) {
        json.forEach((o, i) => {
          const mapped = {
            kind: 'csv',
            file_line: i + 1,
            companion1_name: String(o?.companion1_name || o?.name || '').trim(),
            companion2_name: String(o?.companion2_name || '').trim(),
            leader: String(o?.leader || o?.leader_id || '').trim(),
            companion1_email: String(o?.companion1_email || '').trim(),
            companion2_email: String(o?.companion2_email || '').trim(),
            label: `${o?.companion1_name || '(no companion 1)'}`,
          };
          if (!mapped.companion1_name) mapped.skip = true;
          records.push(mapped);
        });
      } else if (Array.isArray(json.districts)) {
        const previewRows = [];
        for (const district of json.districts) {
          for (const comp of district.companionships || []) {
            previewRows.push({
              kind: 'pdf',
              district_number: district.district,
              leader: district.leader,
              companion1_name: comp.companion_1?.name || '',
              companion2_name: comp.companion_2?.name || '',
              families: comp.families || [],
              label: `D${district.district} ${comp.companion_1?.name || '?'}`,
            });
          }
        }
        records = previewRows;
        dryPayload = json.districts;
      } else if (typeof json.csv === 'string') {
        const r = mapCsvRows(json.csv);
        records = r.rows;
        dryPayload = json.csv;
      } else {
        recordError({ field: 'json.shape', message: 'JSON must be a parse-pdf preview ({ districts }), a { csv } payload, or an array of row objects.' });
      }
    }
  } else {
    // csv / lenient default
    const r = mapCsvRows(buffer.toString('utf8'));
    records = r.rows;
    dryPayload = buffer.toString('utf8');
  }

  // --limit truncation
  if (flags.limit != null && records.length > flags.limit) {
    log(`--limit ${flags.limit}: truncating ${records.length} records to ${flags.limit}`);
    records = records.slice(0, flags.limit);
  }

  // 3. Per-record pass (validation + logging)
  let wouldImport = [];
  for (const rec of records) {
    summary.totals.parsed += 1;
    try {
      if (rec.skip) {
        summary.totals.skipped += 1;
        verbose(`skipped row ${rec.file_line ?? '-'}: ${rec.reason || 'blank'} (${rec.label})`);
        continue;
      }
      if (rec.kind === 'pdf') {
        if (!rec.companion1_name) throw new Error('companionship has no companion 1');
        if (!rec.families.length) recordWarning(`D${rec.district_number}: ${rec.label} has no assigned families`);
      } else if (!rec.companion1_name) {
        throw new Error('row has no companion 1 name');
      }
      wouldImport.push(rec);
      log(`parsed row ${summary.totals.parsed}: ${rec.label}${rec.kind === 'pdf' ? ` (district ${rec.district_number}, leader ${rec.leader || '?'})` : ` (line ${rec.file_line})`}`);
    } catch (e) {
      recordError({
        row: rec.file_line ?? summary.totals.parsed,
        field: rec.kind === 'pdf' ? 'companion_1' : 'companion1_name',
        message: e.message,
        context: rec.label,
      });
    }
  }

  log(`parse phase complete: parsed=${summary.totals.parsed} importable=${wouldImport.length} skipped=${summary.totals.skipped} errored=${summary.totals.errored} warnings=${summary.warnings.length}`);

  // 4. Write phase (skipped entirely in dry-run). PDF-kind records (real PDF
  //    files OR { districts } JSON previews) go through /api/admin/roster/import;
  //    CSV-kind records go through /api/admin/import-roster as canonical CSV.
  const pdfRecordCount = wouldImport.filter((r) => r.kind === 'pdf').length;
  if (!flags.dryRun && pdfRecordCount > 0 && wouldImport.length > 0) {
    // Rebuild the district payload from the exact (possibly truncated) record
    // set so what we claim to import matches what we import.
    const byDistrict = new Map();
    for (const rec of wouldImport) {
      if (!byDistrict.has(rec.district_number)) {
        byDistrict.set(rec.district_number, {
          district: rec.district_number,
          leader: rec.leader || null,
          companionships: [],
        });
      }
      byDistrict.get(rec.district_number).companionships.push({
        companion_1: rec.companion1_name ? { name: rec.companion1_name } : null,
        companion_2: rec.companion2_name ? { name: rec.companion2_name } : null,
        families: rec.families || [],
      });
    }
    dryPayload = [...byDistrict.values()];
  }
  const isPdfImport = !flags.dryRun && pdfRecordCount > 0;

  if (flags.dryRun) {
    log('DRY RUN — no database writes performed.');
    summary.totals.imported = 0;
  } else if (wouldImport.length > 0) {
    log(`import phase: writing ${wouldImport.length} records through the admin endpoints…`);
    try {
      const result = await withServer(async (base) => {
        if (isPdfImport) {
          const payload = { districts: dryPayload };
          log(`POST /api/admin/roster/import (${(payload.districts || []).length} districts)`);
          const data = await postJson(base, '/api/admin/roster/import', payload, 'PDF import');
          log(`import ok: added=${data.added} updated=${data.updated} households=${data.households_upserted} links=${data.links_upserted}`);
          return { data, count: (data.added || 0) + (data.updated || 0) };
        }
        // csv / json-as-csv: rebuild canonical CSV from mapped rows and hand it
        // to the CSV endpoint (server owns matching/upsert semantics).
        const csvText = [CANONICAL_CSV_HEADER, ...wouldImport.map(ROW_TO_CSV)].join('\n');
        log(`POST /api/admin/import-roster (${wouldImport.length} rows)`);
        const data = await postCsv(base, csvText, 'CSV import');
        log(`import ok: added=${data.added} updated=${data.updated} total=${data.total}`);
        return { data, count: (data.added || 0) + (data.updated || 0) };
      });
      summary.totals.imported = result.count;
    } catch (e) {
      // Whole-batch failure (the server endpoints are atomic per request):
      // log it as a single import error; record rows stay parsed-but-unwritten.
      recordError({ row: null, field: 'import.write', message: e.message, context: `batch of ${wouldImport.length} records` });
    }
  } else {
    log('import phase: no importable records — nothing to write.');
  }

  // 5. Wrap up
  summary.finished_at = new Date().toISOString();
  summary.duration_ms = Date.now() - new Date(summary.started_at).getTime();
  summary.exit_code = summary.totals.errored > 0 ? 1 : 0;
  writeSummaryFile();
  log(`done: ${summary.totals.imported} imported, ${summary.totals.skipped} skipped, ${summary.totals.errored} errored — exit ${summary.exit_code}`);
  log(`log: ${path.relative(process.cwd(), logPath)}`);
  log(`summary: ${path.relative(process.cwd(), summaryPath)}`);
  process.exitCode = summary.exit_code;
}

function writeSummaryFile() {
  try {
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    fs.writeFileSync(logPath, `${logLines.join('\n')}\n`);
  } catch (e) {
    process.stderr.write(`failed to write log/summary: ${e.message}\n`);
  }
}

main().catch((e) => {
  err(`fatal: ${e.stack || e.message}`);
  summary.finished_at = new Date().toISOString();
  summary.exit_code = 1;
  writeSummaryFile();
  process.exit(1);
});
