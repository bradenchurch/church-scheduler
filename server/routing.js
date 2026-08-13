// Smart routing for QR interview requests.
//
// When an elder/companionship submits a QR request it lands in `qr_requests`
// with `status = 'pending'`. Smart routing assigns it to a presidency member
// (interviewer) using a workload + availability heuristic:
//
//   1. Fewest active assignments (qr_requests.assigned_to = leader.id AND status = 'assigned')
//   2. Tiebreaker: most available slots this week (leader's configured weekly slots)
//
// This app is single-ward (Long Valley 2nd Ward), so there is no ward filter.

/**
 * Eligible "presidency members" = active leaders who are actual interviewers.
 *
 * An interviewer is a leader who has at least one companionship (district) OR
 * at least one availability slot. This naturally excludes coordinators (e.g.
 * the "admin" who sets up the quarter but carries no interview load) while
 * still including presidency members whose `role` happens to be `admin`
 * (e.g. a counselor who is also an interviewer).
 */
export async function getEligibleLeaders(supabase) {
  const [leadersRes, compsRes, slotsRes] = await Promise.all([
    supabase.from('leaders').select('id, name, role').eq('active', true),
    supabase.from('companionships').select('leader_id').not('leader_id', 'is', null),
    supabase.from('slots').select('leader_id').not('leader_id', 'is', null),
  ]);

  if (leadersRes.error) throw leadersRes.error;

  const interviewerIds = new Set();
  (compsRes.data || []).forEach((c) => interviewerIds.add(c.leader_id));
  (slotsRes.data || []).forEach((s) => interviewerIds.add(s.leader_id));

  return (leadersRes.data || []).filter((l) => interviewerIds.has(l.id));
}

/** Count a leader's active (still-uncompleted) QR assignments. */
export async function countActiveAssignments(supabase, leaderId) {
  const { count, error } = await supabase
    .from('qr_requests')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_to', leaderId)
    .eq('status', 'assigned');
  if (error) throw error;
  return count || 0;
}

/**
 * Count a leader's available slots this week.
 *
 * Slots are weekly-recurring (day_of_week + start_time, no date column), so
 * every configured slot recurs within the next 7 days. "Available this week"
 * therefore equals the leader's configured weekly slot count — more slots
 * means more capacity.
 */
export async function countAvailableSlotsThisWeek(supabase, leaderId) {
  const { count, error } = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('leader_id', leaderId);
  if (error) throw error;
  return count || 0;
}

/**
 * Assign the oldest pending QR request to the presidency member with the
 * fewest active assignments (tiebreak: most available slots this week).
 *
 * `wardId` is accepted for forward-compatibility with a future multi-ward
 * deployment; this app is single-ward so it is currently unused.
 *
 * Returns:
 *   { ok: true, message: 'no pending requests' }                — nothing to do (200)
 *   { ok: false, error: 'no available leaders', status: 409 }   — no eligible assignee (409)
 *   { ok: true, request_id, assigned_to, leader_name }          — assigned (200)
 */
export async function assignNextPending(supabase, _wardId = null) {
  // 1. Oldest pending request (FIFO by submitted_at).
  const { data: pending, error: pendingErr } = await supabase
    .from('qr_requests')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(1);

  if (pendingErr) throw pendingErr;
  if (!pending || pending.length === 0) {
    return { ok: true, message: 'no pending requests' };
  }
  const request = pending[0];

  // 2. Eligible leaders (interviewers).
  const leaders = await getEligibleLeaders(supabase);
  if (!leaders || leaders.length === 0) {
    return { ok: false, error: 'no available leaders', status: 409 };
  }

  // 3. Pick the leader with fewest active assignments (tiebreak: most slots).
  let best = null;
  let bestLoad = Infinity;
  let bestSlots = -1;
  for (const leader of leaders) {
    const load = await countActiveAssignments(supabase, leader.id);
    const slots = await countAvailableSlotsThisWeek(supabase, leader.id);
    if (load < bestLoad || (load === bestLoad && slots > bestSlots)) {
      best = leader;
      bestLoad = load;
      bestSlots = slots;
    }
  }

  // 4. Persist the assignment.
  const { data: updated, error: updateErr } = await supabase
    .from('qr_requests')
    .update({ status: 'assigned', assigned_to: best.id, assigned_at: new Date().toISOString() })
    .eq('id', request.id)
    .select('id, status, assigned_to')
    .maybeSingle();

  if (updateErr) throw updateErr;

  return {
    ok: true,
    request_id: request.id,
    assigned_to: best.id,
    leader_name: best.name,
    updated,
  };
}
