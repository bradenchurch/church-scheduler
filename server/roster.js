// Read-only roster data access for church-scheduler.
//
// The ministering roster is extracted from the official PDF into static JSON
// (see server/data/roster-companionships.json and roster-households.json).
// These helpers load and index that data for the public /api/companions and
// /api/families routes and the admin /api/admin/roster route. No database
// access is required for read-only roster views, so these routes are fully
// deterministic and self-contained.

import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'fs';
import crypto from 'crypto';

const DATA_DIR = new URL('./data/', import.meta.url);

function loadJson(name) {
  return JSON.parse(readFileSync(new URL(name, DATA_DIR), 'utf8'));
}

let _roster = null;

export function getRoster() {
  if (_roster) return _roster;

  const companionships = loadJson('roster-companionships.json');
  const households = loadJson('roster-households.json');

  // Flatten households and index by id for O(1) lookup when enriching a
  // companionship's families with phone/email/members.
  const householdById = new Map();
  const householdsFlat = [];
  for (const district of households.districts || []) {
    for (const hh of district.households || []) {
      const enriched = { ...hh, district_number: district.district };
      householdById.set(hh.id, enriched);
      householdsFlat.push(enriched);
    }
  }

  // Presidency member contact info by district. Authoritative source is the
  // households.json president record (carries phone/email); the companionships
  // JSON only stores the bare name string.
  const presidencyByDistrict = new Map();
  for (const district of households.districts || []) {
    const p = district.president || {};
    const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    presidencyByDistrict.set(district.district, {
      name: name || p.name || '',
      email: p.email || '',
      phone: p.phone || '',
    });
  }

  _roster = {
    ward: households.ward || companionships.ward || 'long-valley-2nd-ward',
    companionships: companionships.companionships || [],
    householdsFlat,
    householdById,
    presidencyByDistrict,
    districts: households.districts || [],
  };
  return _roster;
}

// Companions whose `notes` carry this marker have no household record in
// roster-households.json — they exist in the companionships JSON but were never
// mapped to a household, so an admin must attach them by hand. This is the
// authoritative definition of "unlinked companion".
const UNLINKED_NOTES_MARKER = 'not_in_households_json';

// List companions with no household record, normalized to `{ id, name, district }`.
//
// Companions carry no `id` of their own in the source JSON, so the enclosing
// companionship's id is used as the stable key. An unlinked companion is always
// the non-head partner (the head carries a `cross_district` note instead), so
// there is at most one per companionship and the companionship id is unique.
export function getUnlinkedCompanions() {
  const { companionships } = getRoster();
  const unlinked = [];
  for (const comp of companionships) {
    for (const companion of comp.companions || []) {
      if ((companion.notes || '').includes(UNLINKED_NOTES_MARKER)) {
        unlinked.push({
          id: comp.id,
          name: companion.name,
          district: comp.district,
        });
      }
    }
  }
  return unlinked;
}

// Build a single-line address from a household head's structured fields.
export function formatAddress(head) {
  if (!head) return '';
  const street = head.address || '';
  const cityLine = [head.city, head.state, head.zip].filter(Boolean).join(' ');
  return [street, cityLine].filter(Boolean).join(', ');
}

// Split a companionship's companions into { companion_1, companion_2 },
// where companion_1 is the head (primary) and companion_2 is the partner
// (or null for single-elder companionships).
export function splitCompanions(companions = []) {
  const list = [...companions];
  const head = list.find((c) => c.head) || list[0] || null;
  const other = list.find((c) => c !== head) || null;
  const toCompanion = (c) =>
    c ? { name: c.name, phone: c.phone || '', email: c.email || '' } : null;
  return { companion_1: toCompanion(head), companion_2: toCompanion(other) };
}


export function writeEmptyRoster() {
  const roster = getRoster();
  
  const emptyCompanionships = {
    ward: roster.ward || 'long-valley-2nd-ward',
    companionships: []
  };
  
  const emptyHouseholds = {
    ward: roster.ward || 'long-valley-2nd-ward',
    districts: (roster.districts || []).map(d => ({
      district: d.district,
      president: d.president || {},
      households: []
    }))
  };
  
  _roster = null;

  // Skip JSON file sync on Vercel — /var/task is read-only and /tmp/ is per-invocation.
  // The DB is the source of truth.
  if (process.env.VERCEL) return;

  const companionshipsPath = new URL('roster-companionships.json', DATA_DIR);
  const householdsPath = new URL('roster-households.json', DATA_DIR);
  const compTmp = new URL('roster-companionships.json.tmp', DATA_DIR);
  const hhTmp = new URL('roster-households.json.tmp', DATA_DIR);
  
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(compTmp, JSON.stringify(emptyCompanionships, null, 2), 'utf8');
    writeFileSync(hhTmp, JSON.stringify(emptyHouseholds, null, 2), 'utf8');
    
    renameSync(compTmp, companionshipsPath);
    renameSync(hhTmp, householdsPath);
  } catch (err) {
    console.warn(`[roster] JSON sync skipped:`, err);
  }
}

export function writeRoster(parsedRoster) {
  const oldRoster = getRoster();
  
  const companionships = [];
  const districtsMap = new Map();
  
  for (const d of (oldRoster.districts || [])) {
    districtsMap.set(d.district, {
      district: d.district,
      president: d.president || {},
      households: []
    });
  }

  for (const d of (parsedRoster.districts || [])) {
    const districtNumber = Number(d.district);
    let distObj = districtsMap.get(districtNumber);
    if (!distObj) {
      distObj = {
        district: districtNumber,
        president: { name: d.leader || '' },
        households: []
      };
      districtsMap.set(districtNumber, distObj);
    }
    
    for (const comp of (d.companionships || [])) {
      const compId = crypto.randomUUID();
      const compCompanions = [];
      if (comp.companion_1 && comp.companion_1.name) {
        compCompanions.push({
          name: comp.companion_1.name,
          phone: comp.companion_1.phone || '',
          email: comp.companion_1.email || '',
          head: true
        });
      }
      if (comp.companion_2 && comp.companion_2.name) {
        compCompanions.push({
          name: comp.companion_2.name,
          phone: comp.companion_2.phone || '',
          email: comp.companion_2.email || '',
          head: false,
          notes: comp.companion_2.notes || ''
        });
      }
      
      const families_visited = [];
      
      for (const fam of (comp.families || [])) {
        const famName = typeof fam === 'string' ? fam : (fam.family_name || fam.name || '');
        const hhId = crypto.randomUUID();
        
        distObj.households.push({
          id: hhId,
          name: typeof fam === 'string' ? `${fam} Family` : (fam.name || `${famName} Family`),
          family_name: famName,
          head: typeof fam === 'string' ? {
            first_name: '', last_name: famName, phone: '', email: '', address: '', city: '', state: '', zip: ''
          } : (fam.head || {}),
          members: typeof fam === 'string' ? [] : (fam.members || []),
          category: 'family',
          notes: ''
        });
        
        families_visited.push({
          household_id: hhId,
          family_name: famName,
          head_name: `${famName} Family`,
          address: '',
          category: 'family'
        });
      }
      
      companionships.push({
        id: compId,
        district: districtNumber,
        presidency_member: distObj.president?.name || '',
        companions: compCompanions,
        families_visited
      });
    }
  }

  const newCompanionships = {
    ward: oldRoster.ward || 'long-valley-2nd-ward',
    companionships
  };
  
  const newHouseholds = {
    ward: oldRoster.ward || 'long-valley-2nd-ward',
    districts: Array.from(districtsMap.values()).sort((a, b) => a.district - b.district)
  };
  
  _roster = null;

  // Skip JSON file sync on Vercel — /var/task is read-only and /tmp/ is per-invocation.
  // The DB is the source of truth.
  if (process.env.VERCEL) return;

  const companionshipsPath = new URL('roster-companionships.json', DATA_DIR);
  const householdsPath = new URL('roster-households.json', DATA_DIR);
  const compTmp = new URL('roster-companionships.json.tmp', DATA_DIR);
  const hhTmp = new URL('roster-households.json.tmp', DATA_DIR);
  
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(compTmp, JSON.stringify(newCompanionships, null, 2), 'utf8');
    writeFileSync(hhTmp, JSON.stringify(newHouseholds, null, 2), 'utf8');
    
    renameSync(compTmp, companionshipsPath);
    renameSync(hhTmp, householdsPath);
  } catch (err) {
    console.warn(`[roster] JSON sync skipped:`, err);
  }
}
