// Native parser for Church LCR "Ministering Assignments.pdf" exports.
//
// Scope (per Braden 2026-08-18):
//   We only need THREE fields:
//     - family name (household identifier)
//     - companion names (the pair who ministers)
//     - supervisor (district presidency member)
//
//   Everything else (phone, email, address, city/state/zip, family-member
//   names/ages/genders) is noise. We do not extract it. We do not even
//   classify it. We skip the line and move on.
//
// Why this exists:
//   LCR exports ministering assignments as a formatted PDF with stacked table
//   cells (Companion 1 + Companion 2 share a single row, separated by line
//   breaks) and bulleted assigned-family lists. Naive PDF→CSV converters treat
//   line breaks as new rows, which scrambles every assignment. This module
//   parses the raw text stream from pdf-parse and reconstructs the layout.
//
// Observed LCR PDF layout:
//
//   <ward header>
//   <stake header>
//   <page footer line 1>
//
//   Companion 1 record (4-5 lines, NO family-member lines after):
//       "Behymer, Austin"
//       "435-429-9843"
//       "1884 S Tower Bridge Dr."
//       "Washington UT 84780"
//       "Austin.behymer@gmail.com"
//
//   Companion 2 record (4-5 lines, NO family-member lines after):
//       "Tower, Bridger"
//       "801-300-7473"
//       "1719 S Devils Garden Ln"
//       "Washington UT 84780-3716"
//       "bridgertower@gmail.com"
//
//   Family record (5 lines, ALWAYS followed by 1+ member lines):
//       "Evans"
//       "+18018579204"
//       "1865 S Tower Bridge Dr"
//       "Washington UT 84780"
//       "lukept3221@gmail.com"
//       "Evans, Luke Male 22 Sep"            <- member line
//       "Evans, Bailey Female 2 Jun"         <- member line
//
//   District boundaries:
//       "District 1"
//       "Presidency Member:  Chollet, Cole"
//
// Strategy:
//   1. Extract text via pdf-parse (using the lib subpath to skip its debug
//      test-PDF lookup).
//   2. Filter out page headers, footers, district footers, dot separators.
//   3. Split the document into district sections via "District N" headers,
//      and capture the supervisor name from the matching "Presidency
//      Member:" label.
//   4. Walk lines and classify each as:
//        - 'name'        (start of a person record)
//        - 'contact'     (phone / address / city-state-zip / email)
//        - 'member'      (compressed family-member line)
//        - 'district'    (district header)
//        - 'presidency'  (presidency header)
//        - 'noise'       (catch-all)
//   5. Build person records: a 'name' line starts a record; subsequent
//      'contact' lines are consumed-and-discarded. When the next non-contact
//      line arrives, the record is sealed.
//   6. A record is a FAMILY HEAD if the next non-contact line is a 'member'
//      line. Otherwise it is a COMPANION.
//   7. Family-member lines are consumed and discarded (we only need the
//      family name — which is the head record's name).
//   8. Group companion records into PAIRS. Attach family-head records to
//      the most recently opened companionship. Trailing solo companion
//      becomes a single-elder companionship with a warning.
//   9. Emit audit warnings for anomalies (single companions, missing
//      supervisor, family-before-companion, etc.).
//
// This module is pure / stateless — it does not touch the database. The
// caller (POST /api/admin/roster/import) decides how to commit the parsed
// payload to Supabase.

import pdfParse from 'pdf-parse/lib/pdf-parse.js';

// ---------------------------------------------------------------------------
// Pattern helpers
// ---------------------------------------------------------------------------

// Family-member line: "<Lastname>, <Firstname...> Male|Female <DD> <Mon>".
// pdf-parse outputs these lines in two inconsistent formats:
//   spaced:    "Evans, Luke Male 22 Sep"
//   compressed:"Evans, LukeMale22 Sep"
//
// Examples that must match:
//   "Evans, Luke Male 22 Sep"
//   "Evans, LukeMale22 Sep"
//   "Mann, Zoe AnnFemale8 Aug"
//   "Wegesend, Shiloh Kanoelani Kaipūa'a'laa Namakaokaha'i Akira Female 17 Apr"
//
// Examples that must NOT match:
//   "Bracken, Kenneth Mar"          ← "Mar" is a middle name, not a month
//   "Miles, Wyatt"                  ← missing Male|Female
const MEMBER_LINE_RE = /^[A-Z][a-zA-Z'’.\u0101.-]+,\s+[A-Z][a-zA-Z'’.\u0101.-]+(?:\s+[A-Z][a-zA-Z'’.\u0101.-]+)*\s*(?:Male|Female)\s*\d{1,2}\s*[A-Z][a-z]{2}$/;

// District header: "District N" exactly.
const DISTRICT_HEADER_RE = /^District\s+(\d+)$/;

// Presidency member label on a district boundary:
//   "Presidency Member:  Chollet, Cole"   (note double space)
//   "Presidency Member: Tupuola, Kawika"
const PRESIDENCY_HEADER_RE = /^Presidency Member:\s+(.+)$/;

// Page-header line: "Ministering Assignments" — appears on every page.
const PAGE_HEADER_RE = /^Ministering Assignments$/;

// Ward identifier: "Long Valley 2nd Ward (2302934)".
const WARD_LINE_RE = /^Long Valley .* Ward \(\d+\)$/;

// Stake identifier.
const STAKE_LINE_RE = /^Washington Utah .* Stake \(\d+\)$/;

// Page footer: "N For Church Use Only © 2026 ..." or "<N> For Church Use..."
const PAGE_FOOTER_LINE_RE = /^\d+\s+For Church Use Only\b/;

// Dot separator used as visual page break.
const DOT_SEPARATOR_RE = /^\.+\s*$/;

// Repeated presidency footer line that appears at the bottom of every page.
// e.g., "Presidency Member: Chollet, Cole 435-218-1455 | cole.chollet1@gmail.com"
const PRESIDENCY_FOOTER_RE = /^Presidency Member:.+\|\s*\S+@\S+/;

// ---------------------------------------------------------------------------
// Line extraction
// ---------------------------------------------------------------------------

/**
 * Extract a flat, ordered list of text lines from a PDF buffer.
 */
async function pdfToLines(buffer) {
  const result = await pdfParse(buffer);
  const lines = [];
  for (const raw of (result.text || '').split(/\r?\n/)) {
    const trimmed = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!trimmed) continue;
    lines.push(trimmed);
  }
  return lines;
}

/**
 * Filter out page headers/footers, district footers, dot separators.
 */
function filterNoise(lines) {
  return lines.filter((line) => {
    if (PAGE_HEADER_RE.test(line)) return false;
    if (WARD_LINE_RE.test(line)) return false;
    if (STAKE_LINE_RE.test(line)) return false;
    if (PAGE_FOOTER_LINE_RE.test(line)) return false;
    if (DOT_SEPARATOR_RE.test(line)) return false;
    if (PRESIDENCY_FOOTER_RE.test(line)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Line classification
// ---------------------------------------------------------------------------

/**
 * Classify a line by type. Used to decide how to consume it while walking.
 *
 *   'name'        — start of a person record (a family head or a companion)
 *   'member'      — family-member line (e.g., "Evans, Luke Male 22 Sep")
 *   'district'    — "District N" header
 *   'presidency'  — "Presidency Member: X" label
 *   'contact'     — anything that looks like a phone, address, city/state,
 *                    or email line. We DO NOT extract these — we just skip
 *                    past them so the next 'name' line can start the next
 *                    person record.
 *   'noise'       — catch-all (rare, after filtering)
 */
function classifyLine(line) {
  if (DISTRICT_HEADER_RE.test(line)) return 'district';
  if (PRESIDENCY_HEADER_RE.test(line)) return 'presidency';
  if (MEMBER_LINE_RE.test(line)) return 'member';

  // Name heuristic: "<Last>, <First...>" (possibly multi-word first/middle),
  // or a single capitalized word (like "Evans", "Mann", "Walker" — single-
  // word family surnames that LCR emits for families whose head-of-household
  // has no first name in the directory).
  //
  // Constraints we enforce to avoid false positives:
  //   - Must start with an uppercase letter.
  //   - Must NOT contain digits (would be a phone or street address).
  //   - Must NOT match the city/state/zip shape "CityName ST 12345".
  //   - Must NOT be a multi-word sentence (which would be an address or
  //     other body text).
  if (/^[A-Z][a-zA-Z'’.\-]+(?:,\s+[A-Z][a-zA-Z'’.\-]+(?:\s+[A-Z][a-zA-Z'’.\-]+)*)?$/.test(line)) {
    return 'name';
  }

  return 'contact';
}

// ---------------------------------------------------------------------------
// Person record extraction (NAME ONLY — contact fields are dropped)
// ---------------------------------------------------------------------------

/**
 * Walk a list of district lines and group them into person records.
 *
 * A record starts with a 'name' line and consumes any contiguous 'contact'
 * lines that follow (those are skipped — we don't extract them). The record
 * is sealed when the next non-contact line arrives. If that next non-contact
 * line is a 'member' line, the record is marked as a family head and all
 * contiguous member lines are consumed and discarded.
 *
 * Returns an array of records, each shaped:
 *   { name, is_family }
 */
function buildRecords(lines) {
  const records = [];
  let i = 0;

  while (i < lines.length) {
    const kind = classifyLine(lines[i]);
    if (kind !== 'name') {
      // Skip district / presidency / member / contact / noise lines.
      i += 1;
      continue;
    }

    const record = {
      name: lines[i],
      is_family: false,
    };
    i += 1;

    // Skip contiguous contact lines (phone / address / citystate / email).
    while (i < lines.length && classifyLine(lines[i]) === 'contact') {
      i += 1;
    }

    // If the next line is a member line, this record is a family head.
    // Consume all consecutive member lines (we don't extract their names).
    if (i < lines.length && classifyLine(lines[i]) === 'member') {
      record.is_family = true;
      while (i < lines.length && classifyLine(lines[i]) === 'member') {
        i += 1;
      }
    }

    records.push(record);
  }

  return records;
}

// ---------------------------------------------------------------------------
// Companionship grouping
// ---------------------------------------------------------------------------

/**
 * Group records into companionships:
 *   - Companion records pair up (2 companions per companionship).
 *   - Family records encountered after a companionship is opened attach to it.
 *   - A trailing solo companion becomes a single-elder companionship with a
 *     'single_companion' warning.
 */
function groupIntoCompanionships(records) {
  const groups = [];
  let current = null;

  const closeCurrent = () => {
    if (!current) return;
    groups.push(current);
    current = null;
  };

  const startNew = (comp1Record) => {
    current = {
      companion_1: { name: comp1Record.name },
      companion_2: null,
      families: [],
      warnings: [],
    };
  };

  for (const rec of records) {
    if (!rec.is_family) {
      // Companion record. A non-family record is either C1 or C2 of a
      // companionship. If `current` already has C1+C2, this record is C1 of
      // the NEXT companionship — close the previous one first so its trailing
      // families stay attached.
      if (!current || current.companion_2) {
        closeCurrent();
        startNew(rec);
      } else {
        // current has only C1 — this is C2. Keep `current` open so trailing
        // families attach to this companionship (NOT to a phantom next one).
        current.companion_2 = { name: rec.name };
      }
    } else {
      // Family record. Attach to the current companionship (if any).
      if (current) {
        current.families.push(rec.name);
      } else {
        // Family before any companion — orphan. Surface as a warning on a
        // synthetic empty companionship so the user can see it.
        groups.push({
          companion_1: null,
          companion_2: null,
          families: [rec.name],
          warnings: [{
            code: 'orphan_family',
            target: 'block',
            message: `Family "${rec.name}" appeared before any companion pair`,
          }],
        });
      }
    }
  }

  // Close the trailing companionship (it may still be open waiting for more
  // families we never saw).
  closeCurrent();

  return groups;
}

// ---------------------------------------------------------------------------
// District splitting
// ---------------------------------------------------------------------------

/**
 * Split the filtered line list into district sections.
 *
 * LCR PDF layout quirk: the "District N" header sits at the BOTTOM of each
 * district page (just before the page footer), not at the top. So a "District N"
 * header that appears mid-document does NOT mean district N is starting fresh —
 * it means "the previous page belonged to district N". We track the currently
 * active district by updating it whenever we see a "District N" line and
 * emitting a fresh section every time the district changes.
 *
 * The first section of the PDF (before any District header) is assumed to
 * belong to District 1, since D1 always appears first in the ward.
 */
function splitByDistrict(lines) {
  const sections = [];
  let current = null;
  let preface = [];

  const ensureSection = (district, leader = '') => {
    if (!current || current.district !== district) {
      current = { district, leader, leaderContact: null, lines: [] };
      sections.push(current);
    } else if (leader && !current.leader) {
      current.leader = leader;
    }
  };

  for (const line of lines) {
    const distMatch = line.match(DISTRICT_HEADER_RE);
    if (distMatch) {
      ensureSection(Number(distMatch[1]));
      continue;
    }
    const presMatch = line.match(PRESIDENCY_HEADER_RE);
    if (presMatch) {
      if (current) current.leader = presMatch[1].trim();
      continue;
    }
    if (!current) {
      // First content lines (before any "District N" header) belong to D1.
      ensureSection(1);
    }
    current.lines.push(line);
  }

  return { sections, preface };
}

// ---------------------------------------------------------------------------
// Per-district parsing
// ---------------------------------------------------------------------------

function parseDistrict(section) {
  const records = buildRecords(section.lines);
  const groups = groupIntoCompanionships(records);

  // Post-pass: emit warnings for each block.
  for (const block of groups) {
    if (!block.companion_1) continue;

    if (!block.companion_2) {
      block.warnings.push({
        code: 'single_companion',
        target: 'companion_2',
        message: `${block.companion_1.name} has no assigned partner`,
      });
    }

    if (block.companion_2 && block.families.length === 0) {
      const who = block.companion_1.name || 'unknown';
      block.warnings.push({
        code: 'no_families',
        target: 'block',
        message: `No assigned families detected for ${who}`,
      });
    }
  }

  return {
    district: section.district,
    leader: section.leader,
    warnings: section.leader
      ? []
      : [{
          code: 'missing_district_leader',
          district: section.district,
          message: `District ${section.district}: no supervisor name detected — assign by district number`,
        }],
    companionships: groups,
  };
}

// ---------------------------------------------------------------------------
// Top-level parse entry point
// ---------------------------------------------------------------------------

/**
 * Parse an LCR Ministering Assignments PDF buffer into a structured JSON
 * payload suitable for the import preview UI.
 *
 * Returns:
 *   {
 *     ward_name: string,
 *     extracted_at: ISO timestamp,
 *     source_filename: string,
 *     totals: { districts, companionships, families, warnings },
 *     warnings: [{ code, message, district?, block_index? }],
 *     districts: [
 *       { district, leader, warnings, companionships: [block, ...] },
 *       ...
 *     ]
 *   }
 */
export async function parseLcrPdf(buffer, sourceFilename = '') {
  const rawLines = await pdfToLines(buffer);
  const lines = filterNoise(rawLines);
  const { sections, preface } = splitByDistrict(lines);

  const ward_name = preface.length > 0
    ? preface
        .find((l) => WARD_LINE_RE.test(l))
        ?.replace(/\s+\(\d+\)$/, '')
        ?.trim() || 'Long Valley 2nd Ward'
    : 'Long Valley 2nd Ward';

  const districts = [];
  let totalCompanionships = 0;
  let totalFamilies = 0;
  const allWarnings = [];

  for (const section of sections) {
    const parsed = parseDistrict(section);
    totalCompanionships += parsed.companionships.length;
    totalFamilies += parsed.companionships.reduce((acc, b) => acc + b.families.length, 0);
    for (const w of parsed.warnings) allWarnings.push(w);
    for (let i = 0; i < parsed.companionships.length; i += 1) {
      for (const w of parsed.companionships[i].warnings) {
        allWarnings.push({ ...w, district: parsed.district, block_index: i });
      }
    }
    districts.push(parsed);
  }

  return {
    ward_name,
    extracted_at: new Date().toISOString(),
    source_filename: sourceFilename,
    totals: {
      districts: districts.length,
      companionships: totalCompanionships,
      families: totalFamilies,
      warnings: allWarnings.length,
    },
    warnings: allWarnings,
    districts,
  };
}