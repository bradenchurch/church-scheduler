// Mock roster data for Phase A.
//
// These objects mirror the response shapes the cs-api-readonly sibling will
// expose once it lands (e.g. GET /api/roster). Pages consume this shape today
// so swapping in real data is a one-line change in each page's load path.

// Real presidency mapping from ARCHITECTURE.md (Long Valley 2nd Ward):
//   Cole Chollet   — 1st Counselor — District 1 (admin + leader)
//   Kawika Tupuola — 2nd Counselor — District 2 (leader)
//   Sean Bryan     — President     — District 3 (leader)
//   Braden Church  — Secretary     — admin
export const PRESIDENCY_ROLES = {
  'Cole Chollet': '1st Counselor',
  'Kawika Tupuola': '2nd Counselor',
  'Sean Bryan': 'President',
  'Braden Church': 'Secretary',
};

// Aggregate totals shown in the roster header bar (Phase A constants).
export const mockTotals = {
  households: 131,
  individuals: 476,
  companionships: 60,
};

// The four companions who need to be attached to a household record.
export const mockUnlinkedCompanions = [
  { id: 'unlinked-1', name: 'Connor Gavin Wood' },
  { id: 'unlinked-2', name: 'Pakiko Wegesend' },
  { id: 'unlinked-3', name: 'Kyle Lemperle' },
  { id: 'unlinked-4', name: 'Taylor Dwayne Sullivan' },
];

const FIRST = [
  'Austin', 'Bridger', 'Luke', 'Ryan', 'David', 'Eli', 'Nainoa', 'Kelii',
  'Jake', 'Sam', 'Tyler', 'Marcus', 'Jordan', 'Caleb', 'Ethan', 'Noah',
  'Isaac', 'Levi', 'Micah', 'Jonah', 'Ezra', 'Asher', 'Silas', 'Weston',
  'Porter', 'Gage', 'Kade', 'Tanner', 'Braxton', 'Ryker', 'Daxton', 'Boston',
  'Kyler', 'Camden', 'Paxton', 'Maddox', 'Colt', 'Nash', 'Jett', 'Crew',
  'Koa', 'Kai', 'Makaio', 'Keanu', 'Ikaika', 'Malakai', 'Josiah', 'Benjamin',
];

const LAST = [
  'Anderson', 'Barlow', 'Pratt', 'Kahale', 'Pakaki', 'Thompson', 'Akamai', 'Chen',
  'Garcia', 'Johnson', 'Lee', 'Patel', 'Brown', 'Smith', 'Davis', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall',
  'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams',
  'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Roberts', 'Carter', 'Phillips',
  'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores',
  'Morris', 'Nguyen', 'Rivera', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey',
];

const DISTRICT_DEFS = [
  { id: 'd1', name: 'Cole Chollet', role: '1st Counselor', comps: 20, households: 44 },
  { id: 'd2', name: 'Kawika Tupuola', role: '2nd Counselor', comps: 20, households: 44 },
  { id: 'd3', name: 'Sean Bryan', role: 'President', comps: 20, households: 43 },
];

// Distribute a total across `count` buckets deterministically (values 1..3).
function distribute(total, count) {
  const base = Math.floor(total / count);
  let rem = total - base * count;
  const arr = new Array(count).fill(base);
  for (let i = 0; i < rem; i += 1) arr[i % count] += 1;
  return arr;
}

function categoryFor(n) {
  if (n % 7 === 6) return 'single';
  if (n % 5 === 4) return 'cross_district';
  return 'family';
}

function buildDistrict(def, index) {
  const householdCounts = distribute(def.households, def.comps);
  const companionships = [];

  for (let c = 0; c < def.comps; c += 1) {
    const first1 = FIRST[(index * 7 + c * 2) % FIRST.length];
    const first2 = FIRST[(index * 7 + c * 2 + 1) % FIRST.length];
    const last1 = LAST[(index * 3 + c) % LAST.length];
    const last2 = LAST[(index * 3 + c + 1) % LAST.length];

    const households = [];
    const count = householdCounts[c];
    for (let h = 0; h < count; h += 1) {
      const n = index * 100 + c * 10 + h;
      const last = LAST[(index * 5 + c + h * 3) % LAST.length];
      const category = categoryFor(n);
      const isSingle = category === 'single';
      households.push({
        id: `hh-${index}-${c}-${h}`,
        name: isSingle ? `${FIRST[n % FIRST.length]} ${last}` : `The ${last} Family`,
        category,
        individuals: isSingle ? 1 : category === 'cross_district' ? 3 : n % 2 === 0 ? 4 : 5,
      });
    }

    companionships.push({
      id: `${def.id}-comp-${c + 1}`,
      name: `${first1} ${last1} & ${first2} ${last2}`,
      companion1: `${first1} ${last1}`,
      companion2: `${first2} ${last2}`,
      households,
    });
  }

  return {
    id: def.id,
    name: def.name,
    role: def.role,
    district: def.id,
    companionshipCount: def.comps,
    householdCount: def.households,
    companionships,
  };
}

export const mockDistricts = DISTRICT_DEFS.map(buildDistrict);

export const mockRoster = {
  totals: mockTotals,
  districts: mockDistricts,
};

// Flattened household list (for the companion-override dropdown).
export const mockHouseholds = mockDistricts.flatMap((d) =>
  d.companionships.flatMap((c) => c.households)
);
