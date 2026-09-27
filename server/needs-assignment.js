// Presidency "Needs assignment" queue (leaders.role admin or leader).
//
// Lists two leftovers the LCR import does not surface well on Roster:
//   1. Solo companionships — companion1 is set, companion2 is null/blank,
//      and the row is not marked intentional_solo.
//   2. Households with no companionship_households row.
//
// Writes go through the service-role client. They update or link existing
// ids. Absorbing one solo into another retargets bookings, chapel
// submissions, QR requests, and household links onto the kept companionship
// before the empty row is deleted, so history is not cascade-deleted.

import crypto from 'crypto';

export const CHILD_TABLES = ['bookings', 'qr_requests', 'chapel_submissions'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class NeedsAssignmentError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'NeedsAssignmentError';
    this.status = status;
  }
}

export function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function normName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertUuid(value, label) {
  if (!UUID_RE.test(String(value || ''))) {
    throw new NeedsAssignmentError(400, `${label} must be a UUID`);
  }
}

function nullIfBlank(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed || null;
}

function assertPersonName(value, label) {
  const name = String(value ?? '').trim();
  if (!name) throw new NeedsAssignmentError(400, `${label} is required`);
  if (name.length > 120) throw new NeedsAssignmentError(400, `${label} is too long`);
  return name;
}

function assertOptionalEmail(value, label) {
  const email = nullIfBlank(value);
  if (email && !email.includes('@')) {
    throw new NeedsAssignmentError(400, `${label} must be an email address`);
  }
  if (email && email.length > 200) {
    throw new NeedsAssignmentError(400, `${label} is too long`);
  }
  return email;
}

export function districtForLeader(leaderId, leaderByDistrict) {
  if (!leaderId || !leaderByDistrict) return null;
  for (const [district, id] of Object.entries(leaderByDistrict)) {
    if (id === leaderId) {
      const n = Number(district);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

function leaderIdForDistrict(districtNumber, leaderByDistrict) {
  if (districtNumber == null || !leaderByDistrict) return null;
  return leaderByDistrict[districtNumber] || leaderByDistrict[String(districtNumber)] || null;
}

export function isOpenSolo(comp) {
  return Boolean(comp)
    && !isBlank(comp.companion1_name)
    && isBlank(comp.companion2_name)
    && !comp.intentional_solo;
}

function headName(household) {
  const name = `${household.head_first_name || ''} ${household.head_last_name || ''}`.trim();
  return name || household.family_name || 'Household';
}

function companionshipLabel(comp) {
  const first = String(comp.companion1_name || '').trim();
  const second = String(comp.companion2_name || '').trim();
  return second ? `${first} & ${second}` : first;
}

function findComp(state, id) {
  return (state.companionships || []).find((c) => c.id === id) || null;
}

function throwIf(error) {
  if (error) throw new NeedsAssignmentError(500, error.message || 'Database error');
}

export async function fetchAssignmentState(supabase) {
  const [comps, households, links, leaders] = await Promise.all([
    supabase
      .from('companionships')
      .select('id, leader_id, companion1_name, companion2_name, companion1_email, companion2_email, intentional_solo'),
    supabase
      .from('households')
      .select('id, ward_slug, family_name, head_first_name, head_last_name, category, district_number, active'),
    supabase.from('companionship_households').select('companionship_id, household_id'),
    supabase.from('leaders').select('id, name, position'),
  ]);
  throwIf(comps.error);
  throwIf(households.error);
  throwIf(links.error);
  throwIf(leaders.error);
  return {
    companionships: comps.data || [],
    households: households.data || [],
    links: links.data || [],
    leaders: leaders.data || [],
  };
}

function presentSolo(comp, ctx) {
  return {
    id: comp.id,
    companion1_name: String(comp.companion1_name || '').trim(),
    companion1_email: comp.companion1_email || null,
    leader_id: comp.leader_id || null,
    leader_name: ctx.leaderName.get(comp.leader_id) || '',
    district_number: districtForLeader(comp.leader_id, ctx.leaderByDistrict),
    household_count: ctx.householdCount.get(comp.id) || 0,
    intentional_solo: Boolean(comp.intentional_solo),
  };
}

function presentCompanionship(comp, ctx) {
  return {
    id: comp.id,
    label: companionshipLabel(comp),
    companion1_name: String(comp.companion1_name || '').trim(),
    companion2_name: isBlank(comp.companion2_name) ? null : String(comp.companion2_name).trim(),
    leader_id: comp.leader_id || null,
    leader_name: ctx.leaderName.get(comp.leader_id) || '',
    district_number: districtForLeader(comp.leader_id, ctx.leaderByDistrict),
    intentional_solo: Boolean(comp.intentional_solo),
    solo: isBlank(comp.companion2_name),
  };
}

export function buildQueue(state, { leaderByDistrict, wardSlug }) {
  const leaderName = new Map((state.leaders || []).map((l) => [l.id, l.name || '']));
  const householdCount = new Map();
  const linkedHouseholds = new Set();
  for (const link of state.links || []) {
    linkedHouseholds.add(link.household_id);
    householdCount.set(link.companionship_id, (householdCount.get(link.companionship_id) || 0) + 1);
  }
  const ctx = { leaderName, householdCount, leaderByDistrict };

  const solos = (state.companionships || []).filter(
    (c) => !isBlank(c.companion1_name) && isBlank(c.companion2_name),
  );
  const needsCompanion = solos
    .filter((c) => !c.intentional_solo)
    .map((c) => presentSolo(c, ctx))
    .sort(byDistrictThenName);
  const intentionalSolos = solos
    .filter((c) => c.intentional_solo)
    .map((c) => presentSolo(c, ctx))
    .sort(byDistrictThenName);

  const needsCompanionship = (state.households || [])
    .filter((h) => h.ward_slug === wardSlug && h.active !== false && !linkedHouseholds.has(h.id))
    .map((h) => {
      const leaderId = leaderIdForDistrict(h.district_number, leaderByDistrict);
      return {
        id: h.id,
        family_name: h.family_name || '',
        head_name: headName(h),
        category: h.category || null,
        district_number: h.district_number ?? null,
        leader_id: leaderId,
        leader_name: leaderId ? leaderName.get(leaderId) || '' : '',
      };
    })
    .sort(byDistrictThenFamily);

  const companionships = (state.companionships || [])
    .map((c) => presentCompanionship(c, ctx))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

  const leaders = (state.leaders || [])
    .map((l) => ({
      id: l.id,
      name: l.name || l.id,
      position: l.position || null,
      district_number: districtForLeader(l.id, leaderByDistrict),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  return {
    counts: {
      needs_companion: needsCompanion.length,
      needs_companionship: needsCompanionship.length,
      intentional_solo: intentionalSolos.length,
    },
    needs_companion: needsCompanion,
    needs_companionship: needsCompanionship,
    intentional_solos: intentionalSolos,
    companionships,
    leaders,
  };
}

function byDistrictThenName(a, b) {
  const d = (a.district_number ?? 99) - (b.district_number ?? 99);
  if (d !== 0) return d;
  return a.companion1_name.localeCompare(b.companion1_name, undefined, { sensitivity: 'base' });
}

function byDistrictThenFamily(a, b) {
  const d = (a.district_number ?? 99) - (b.district_number ?? 99);
  if (d !== 0) return d;
  return (a.family_name || a.head_name).localeCompare(b.family_name || b.head_name, undefined, {
    sensitivity: 'base',
  });
}

export function planAddPartner(state, input) {
  assertUuid(input.companionshipId, 'companionship id');
  const target = findComp(state, input.companionshipId);
  if (!target) throw new NeedsAssignmentError(404, 'Companionship not found');
  if (!isBlank(target.companion2_name)) {
    throw new NeedsAssignmentError(409, 'This companionship already has a partner');
  }

  let companion2Name;
  let companion2Email;
  let absorb = null;

  if (input.absorbCompanionshipId) {
    assertUuid(input.absorbCompanionshipId, 'partner companionship id');
    if (input.absorbCompanionshipId === target.id) {
      throw new NeedsAssignmentError(400, 'Choose a different companionship to pair with');
    }
    const absorbed = findComp(state, input.absorbCompanionshipId);
    if (!absorbed) throw new NeedsAssignmentError(404, 'Partner companionship not found');
    if (!isBlank(absorbed.companion2_name)) {
      throw new NeedsAssignmentError(409, 'That companionship already has two companions');
    }
    companion2Name = assertPersonName(absorbed.companion1_name, 'Partner name');
    companion2Email = nullIfBlank(absorbed.companion1_email);
    if (normName(companion2Name) === normName(target.companion1_name)) {
      throw new NeedsAssignmentError(400, 'Partner name matches the companion who is already on this companionship');
    }
    const targetHouseholds = new Set(
      (state.links || []).filter((l) => l.companionship_id === target.id).map((l) => l.household_id),
    );
    absorb = {
      id: absorbed.id,
      household_ids: (state.links || [])
        .filter((l) => l.companionship_id === absorbed.id)
        .map((l) => l.household_id),
      already_on_target: targetHouseholds,
    };
  } else {
    companion2Name = assertPersonName(input.companion2Name, 'Partner name');
    companion2Email = assertOptionalEmail(input.companion2Email, 'Partner email');
    if (normName(companion2Name) === normName(target.companion1_name)) {
      throw new NeedsAssignmentError(400, 'Partner name matches the companion who is already on this companionship');
    }
  }

  return {
    action: 'add_partner',
    companionship_id: target.id,
    companion2_name: companion2Name,
    companion2_email: companion2Email,
    patch: {
      companion2_name: companion2Name,
      companion2_email: companion2Email,
      intentional_solo: false,
    },
    absorb,
  };
}

export function planIntentionalSolo(state, input) {
  assertUuid(input.companionshipId, 'companionship id');
  const target = findComp(state, input.companionshipId);
  if (!target) throw new NeedsAssignmentError(404, 'Companionship not found');
  const intentional = input.intentional !== false;
  if (intentional && !isBlank(target.companion2_name)) {
    throw new NeedsAssignmentError(409, 'Remove the partner before marking this companionship as a solo');
  }
  return {
    action: 'intentional_solo',
    companionship_id: target.id,
    intentional_solo: intentional,
    patch: { intentional_solo: intentional },
  };
}

export function planAssignHousehold(state, input, { leaderByDistrict }) {
  assertUuid(input.householdId, 'household id');
  const household = (state.households || []).find((h) => h.id === input.householdId);
  if (!household) throw new NeedsAssignmentError(404, 'Household not found');

  const existing = (state.links || []).filter((l) => l.household_id === household.id);
  if (existing.length > 0) {
    throw new NeedsAssignmentError(409, 'This household is already assigned to a companionship');
  }

  if (input.companionshipId && input.create) {
    throw new NeedsAssignmentError(400, 'Pass either an existing companionship or a new one, not both');
  }

  if (input.companionshipId) {
    assertUuid(input.companionshipId, 'companionship id');
    const comp = findComp(state, input.companionshipId);
    if (!comp) throw new NeedsAssignmentError(404, 'Companionship not found');
    return {
      action: 'assign_household',
      household_id: household.id,
      companionship_id: comp.id,
      created: false,
      insert: null,
    };
  }

  if (!input.create || typeof input.create !== 'object') {
    throw new NeedsAssignmentError(400, 'Choose a companionship or enter a new one');
  }

  const companion1Name = assertPersonName(input.create.companion1_name, 'Companion name');
  const companion2Name = nullIfBlank(input.create.companion2_name);
  if (companion2Name && companion2Name.length > 120) {
    throw new NeedsAssignmentError(400, 'Partner name is too long');
  }
  if (companion2Name && normName(companion2Name) === normName(companion1Name)) {
    throw new NeedsAssignmentError(400, 'Partner name matches the companion who is already on this companionship');
  }
  const companion1Email = assertOptionalEmail(input.create.companion1_email, 'Companion email');
  const companion2Email = assertOptionalEmail(input.create.companion2_email, 'Partner email');

  let leaderId = nullIfBlank(input.create.leader_id);
  if (leaderId) {
    const known = (state.leaders || []).some((l) => l.id === leaderId);
    if (!known) throw new NeedsAssignmentError(400, 'Unknown district leader');
  } else {
    leaderId = leaderIdForDistrict(household.district_number, leaderByDistrict);
  }

  return {
    action: 'assign_household',
    household_id: household.id,
    companionship_id: null,
    created: true,
    insert: {
      leader_id: leaderId,
      companion1_name: companion1Name,
      companion2_name: companion2Name,
      companion1_email: companion1Email,
      companion2_email: companion2Name ? companion2Email : null,
      intentional_solo: false,
    },
  };
}

async function updateCompanionship(supabase, id, patch) {
  const { error } = await supabase.from('companionships').update(patch).eq('id', id);
  throwIf(error);
}

async function absorbCompanionship(supabase, plan) {
  const fromId = plan.absorb.id;
  const toId = plan.companionship_id;
  for (const table of CHILD_TABLES) {
    const { error } = await supabase.from(table).update({ companionship_id: toId }).eq('companionship_id', fromId);
    throwIf(error);
  }
  for (const householdId of plan.absorb.household_ids) {
    if (plan.absorb.already_on_target.has(householdId)) continue;
    const { error } = await supabase.from('companionship_households').upsert(
      { companionship_id: toId, household_id: householdId },
      { onConflict: 'companionship_id,household_id' },
    );
    if (error && error.code !== '23505') throwIf(error);
  }
  const { error } = await supabase.from('companionships').delete().eq('id', fromId);
  throwIf(error);
}

export async function addPartner(supabase, input) {
  const state = await fetchAssignmentState(supabase);
  const plan = planAddPartner(state, input);
  const result = {
    ok: true,
    dry_run: Boolean(input.dryRun),
    companionship_id: plan.companionship_id,
    companion2_name: plan.companion2_name,
    companion2_email: plan.companion2_email,
    absorbed_companionship_id: plan.absorb ? plan.absorb.id : null,
  };
  if (input.dryRun) return result;

  // Stamp the partner onto the kept row first, then move history, then
  // delete the absorbed solo. Deleting first would cascade-delete bookings.
  await updateCompanionship(supabase, plan.companionship_id, plan.patch);
  if (plan.absorb) await absorbCompanionship(supabase, plan);
  return result;
}

export async function setIntentionalSolo(supabase, input) {
  const state = await fetchAssignmentState(supabase);
  const plan = planIntentionalSolo(state, input);
  const result = {
    ok: true,
    dry_run: Boolean(input.dryRun),
    companionship_id: plan.companionship_id,
    intentional_solo: plan.intentional_solo,
  };
  if (input.dryRun) return result;
  await updateCompanionship(supabase, plan.companionship_id, plan.patch);
  return result;
}

export async function assignHousehold(supabase, input, opts) {
  const state = await fetchAssignmentState(supabase);
  const plan = planAssignHousehold(state, input, opts);
  let companionshipId = plan.companionship_id;

  if (input.dryRun) {
    return {
      ok: true,
      dry_run: true,
      household_id: plan.household_id,
      companionship_id: companionshipId,
      created: plan.created,
      companionship: plan.insert,
    };
  }

  if (plan.created) {
    companionshipId = crypto.randomUUID();
    const { error } = await supabase.from('companionships').insert([
      { id: companionshipId, ...plan.insert },
    ]);
    throwIf(error);
  }

  const { error: linkError } = await supabase.from('companionship_households').upsert(
    { companionship_id: companionshipId, household_id: plan.household_id },
    { onConflict: 'companionship_id,household_id' },
  );
  if (linkError) {
    if (plan.created) {
      await supabase.from('companionships').delete().eq('id', companionshipId);
    }
    throwIf(linkError);
  }

  return {
    ok: true,
    dry_run: false,
    household_id: plan.household_id,
    companionship_id: companionshipId,
    created: plan.created,
  };
}

function sendError(res, err) {
  const status = err instanceof NeedsAssignmentError ? err.status : 500;
  if (status === 500) console.error('[needs-assignment]', err.message);
  res.status(status).json({ error: err.message || 'Needs assignment failed' });
}

export function registerNeedsAssignmentRoutes(app, deps) {
  const { supabaseAdmin, requireSession, requireRole, leaderByDistrict, wardSlug } = deps;
  // Same gate as availability and the rest of the presidency tools:
  // requireRole('leader') allows leaders and admins. Companions are rejected.
  const gate = [requireSession, requireRole('leader')];
  const queueOpts = { leaderByDistrict, wardSlug };

  app.get('/api/admin/needs-assignment', ...gate, async (req, res) => {
    try {
      const state = await fetchAssignmentState(supabaseAdmin);
      res.json(buildQueue(state, queueOpts));
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/needs-assignment/companionships/:id/partner', ...gate, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await addPartner(supabaseAdmin, {
        companionshipId: req.params.id,
        companion2Name: body.companion2_name,
        companion2Email: body.companion2_email,
        absorbCompanionshipId: body.absorb_companionship_id || null,
        dryRun: body.dry_run === true,
      });
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/needs-assignment/companionships/:id/intentional-solo', ...gate, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await setIntentionalSolo(supabaseAdmin, {
        companionshipId: req.params.id,
        intentional: body.intentional_solo !== false,
        dryRun: body.dry_run === true,
      });
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  app.post('/api/admin/needs-assignment/households/:id/assign', ...gate, async (req, res) => {
    try {
      const body = req.body || {};
      const result = await assignHousehold(
        supabaseAdmin,
        {
          householdId: req.params.id,
          companionshipId: body.companionship_id || null,
          create: body.create || null,
          dryRun: body.dry_run === true,
        },
        { leaderByDistrict },
      );
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });
}
