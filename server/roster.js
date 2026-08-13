// Read-only roster data access for church-scheduler.
//
// The ministering roster is extracted from the official PDF into static JSON
// (see server/data/roster-companionships.json and roster-households.json).
// These helpers load and index that data for the public /api/companions and
// /api/families routes and the admin /api/admin/roster route. No database
// access is required for read-only roster views, so these routes are fully
// deterministic and self-contained.

import { readFileSync } from 'fs';

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
