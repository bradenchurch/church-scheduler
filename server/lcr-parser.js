import PDFParser from 'pdf2json';

const MEMBER_LINE_RE = /^[\p{L}'’.-]+(?:\s+[\p{L}'’.-]+)*,\s*[\p{L}'’.-]+(?:\s+[\p{L}'’.-]+)*\s*(?:Male|Female)\s*\d{1,2}\s*[A-Z][a-z]{2}$/u;
const DISTRICT_HEADER_RE = /^District\s+(\d+)$/;
const PRESIDENCY_HEADER_RE = /^Presidency Member:\s+(.+)$/;
const PAGE_HEADER_RE = /^Ministering Assignments$/;
const WARD_LINE_RE = /^.* Ward \(\d+\)$/;
const STAKE_LINE_RE = /^.* Stake \(\d+\)$/;
const PAGE_FOOTER_LINE_RE = /^\d+\s+For Church Use Only\b/;
const DOT_SEPARATOR_RE = /^\.+\s*$/;
const PRESIDENCY_FOOTER_RE = /^Presidency Member:.+\|\s*\S+@\S+/;

function classifyLine(text) {
  if (PAGE_HEADER_RE.test(text)) return 'noise';
  if (WARD_LINE_RE.test(text)) return 'noise';
  if (STAKE_LINE_RE.test(text)) return 'noise';
  if (PAGE_FOOTER_LINE_RE.test(text)) return 'noise';
  if (DOT_SEPARATOR_RE.test(text)) return 'noise';
  if (PRESIDENCY_FOOTER_RE.test(text)) return 'noise';

  if (DISTRICT_HEADER_RE.test(text)) return 'district';
  if (PRESIDENCY_HEADER_RE.test(text)) return 'presidency';
  if (MEMBER_LINE_RE.test(text)) return 'member';

  if (/^\p{Lu}[\p{L}'’.-]*(?:\s+[\p{L}'’.-]+)*(?:,\s+\p{Lu}[\p{L}'’.-]*(?:\s+[\p{L}'’.-]+)*)?$/u.test(text)) {
    return 'name';
  }
  return 'contact';
}

function groupTextsIntoRows(texts) {
  texts.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows = [];
  let currentRow = [];
  let currentY = -1000;
  
  for (const t of texts) {
    if (Math.abs(t.y - currentY) > 0.4) {
      if (currentRow.length > 0) rows.push(currentRow);
      currentRow = [t];
      currentY = t.y;
    } else {
      currentRow.push(t);
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

function extractLines(pages) {
  const allLines = [];
  pages.forEach((page, pageIdx) => {
    const texts = [];
    page.Texts.forEach(t => {
      const text = decodeURIComponent(t.R[0].T).trim();
      if (text) {
        texts.push({ x: t.x, y: t.y + (pageIdx * 100), text });
      }
    });
    
    const rows = groupTextsIntoRows(texts);
    for (const row of rows) {
      let col1 = [], col2 = [], col3 = [];
      row.forEach(t => {
         if (t.x < 15) col1.push(t);
         else if (t.x < 28) col2.push(t);
         else col3.push(t);
      });
      
      const merge = (arr) => {
        if (!arr.length) return null;
        arr.sort((a, b) => a.x - b.x);
        return { x: arr[0].x, y: arr[0].y, text: arr.map(a => a.text).join(' ').trim() };
      };
      
      const c1 = merge(col1);
      const c2 = merge(col2);
      const c3 = merge(col3);
      
      if (c1) allLines.push(c1);
      if (c2) allLines.push(c2);
      if (c3) allLines.push(c3);
    }
  });
  return allLines;
}

function parseDistrict(section) {
  let activeCol1 = null;
  let activeCol2 = null;
  let activeCol3 = null;
  const finishedRecords = [];
  
  for (const t of section.texts) {
    const kind = classifyLine(t.text);
    if (kind === 'noise' || kind === 'district' || kind === 'presidency') continue;
    
    let activeRef;
    if (t.x < 15) activeRef = activeCol1;
    else if (t.x < 28) activeRef = activeCol2;
    else activeRef = activeCol3;
    
    if (activeRef) {
      if (kind === 'name') {
        finishedRecords.push(activeRef);
        activeRef = { x: t.x, y: t.y, lines: [t.text] };
      } else {
        activeRef.lines.push(t.text);
      }
    } else {
      if (kind === 'name') {
        activeRef = { x: t.x, y: t.y, lines: [t.text] };
      }
    }
    
    if (t.x < 15) activeCol1 = activeRef;
    else if (t.x < 28) activeCol2 = activeRef;
    else activeCol3 = activeRef;
  }
  
  if (activeCol1) finishedRecords.push(activeCol1);
  if (activeCol2) finishedRecords.push(activeCol2);
  if (activeCol3) finishedRecords.push(activeCol3);

  const records = finishedRecords.map(r => {
    const is_family = r.lines.some(l => MEMBER_LINE_RE.test(l));
    return { name: r.lines[0], x: r.x, y: r.y, is_family };
  });
  
  records.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 2) return a.x - b.x;
    return a.y - b.y;
  });

  const groups = [];
  let current = null;

  for (const rec of records) {
    if (!rec.is_family) {
      if (!current || current.companion_2 || current.families.length > 0 || Math.abs(current.y - rec.y) > 2) {
        current = { y: rec.y, companion_1: { name: rec.name }, companion_2: null, families: [], warnings: [] };
        groups.push(current);
      } else {
        current.companion_2 = { name: rec.name };
      }
    } else {
      if (current) {
        current.families.push(rec.name);
      } else {
        groups.push({
          y: rec.y,
          companion_1: null,
          companion_2: null,
          families: [rec.name],
          warnings: [{ code: 'orphan_family', target: 'block', message: `Family "${rec.name}" appeared before any companion pair` }]
        });
      }
    }
  }

  for (const block of groups) {
    if (!block.companion_1) continue;
    if (!block.companion_2) {
      block.warnings.push({
        code: 'single_companion',
        target: 'companion_2',
        message: `${block.companion_1.name} has no assigned partner`
      });
    }
    if (block.families.length === 0) {
      const who = block.companion_1.name;
      block.warnings.push({
        code: 'no_families',
        target: 'block',
        message: `No assigned families detected for ${who}`
      });
    }
    delete block.y;
  }

  return {
    district: section.district,
    leader: section.leader,
    warnings: section.leader ? [] : [{
      code: 'missing_district_leader',
      district: section.district,
      message: `District ${section.district}: no supervisor name detected — assign by district number`
    }],
    companionships: groups
  };
}

export async function parseLcrPdf(buffer, sourceFilename = '') {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on("pdfParser_dataError", errData => {
      reject(new Error(errData.parserError));
    });
    
    pdfParser.on("pdfParser_dataReady", pdfData => {
      try {
        const allLines = extractLines(pdfData.Pages);
        if (allLines.length === 0) {
          throw new Error("No readable text found. Is this a scanned PDF? Re-export from LCR as text-based PDF.");
        }

        const districts = [];
        let currentDistrict = null;
        
        for (const line of allLines) {
          const kind = classifyLine(line.text);
          if (kind === 'noise') continue;
          
          if (kind === 'district') {
            const dMatch = line.text.match(DISTRICT_HEADER_RE);
            const dNum = Number(dMatch[1]);
            if (!currentDistrict || currentDistrict.district !== dNum) {
              currentDistrict = { district: dNum, leader: '', texts: [] };
              districts.push(currentDistrict);
            }
            continue;
          }
          if (kind === 'presidency') {
            const pMatch = line.text.match(PRESIDENCY_HEADER_RE);
            if (currentDistrict) {
              currentDistrict.leader = pMatch[1].trim();
            }
            continue;
          }
          
          if (!currentDistrict) {
            currentDistrict = { district: 1, leader: '', texts: [] };
            districts.push(currentDistrict);
          }
          currentDistrict.texts.push(line);
        }

        const ward_name = 'Long Valley 2nd Ward';
        const parsedDistricts = [];
        let totalCompanionships = 0;
        let totalFamilies = 0;
        const allWarnings = [];

        for (const section of districts) {
          const parsed = parseDistrict(section);
          totalCompanionships += parsed.companionships.length;
          totalFamilies += parsed.companionships.reduce((acc, b) => acc + b.families.length, 0);
          for (const w of parsed.warnings) allWarnings.push(w);
          for (let i = 0; i < parsed.companionships.length; i++) {
            for (const w of parsed.companionships[i].warnings) {
              allWarnings.push({ ...w, district: parsed.district, block_index: i });
            }
          }
          parsedDistricts.push(parsed);
        }

        resolve({
          ward_name,
          extracted_at: new Date().toISOString(),
          source_filename: sourceFilename,
          totals: {
            districts: parsedDistricts.length,
            companionships: totalCompanionships,
            families: totalFamilies,
            warnings: allWarnings.length,
          },
          warnings: allWarnings,
          districts: parsedDistricts,
        });
      } catch (err) {
        reject(err);
      }
    });
    
    pdfParser.parseBuffer(buffer);
  });
}
