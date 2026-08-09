/**
 * EQ Presidency Scheduler — Dashboard server-side helpers
 *
 * Called from Dashboard.html template fragments via HtmlService output
 * that includes pre-rendered HTML.
 */

function renderSummary_() {
  const quarter = getCurrentQuarter();
  const comps = getCompanionshipsByQuarter(quarter);
  const leaders = getAllLeaders();
  const summary = leaders.map(leader => {
    const list = comps.filter(c => c.AssignedLeaderId === leader.LeaderId);
    const booked = list.filter(c => c.Status === 'Booked' || c.Status === 'Completed').length;
    const total = list.length;
    const pct = total === 0 ? 0 : Math.round((booked / total) * 100);
    return { leader, total, booked, pct };
  });

  return summary.map(s => {
    const color = s.pct >= 80 ? '#e6f7e6' : s.pct >= 40 ? '#fff8e6' : '#fbe6e6';
    return `
      <div class="summary-card" style="background: ${color};">
        <h3>${s.leader.Name}</h3>
        <div class="label">District ${s.leader.District} - ${s.leader.RoleTitle}</div>
        <div class="big">${s.booked} / ${s.total}</div>
        <div class="label">booked (${s.pct}%)</div>
      </div>
    `;
  }).join('');
}

function renderPendingRows_() {
  const quarter = getCurrentQuarter();
  const comps = getCompanionshipsByQuarter(quarter).filter(c => c.Status === 'Pending');
  const leaders = getAllLeaders();
  const leaderMap = Object.fromEntries(leaders.map(l => [l.LeaderId, l]));

  return comps.map(c => {
    const url = bookingUrlForCompanionship(c.CompanionshipId);
    const leader = leaderMap[c.AssignedLeaderId] || {};
    return `
      <tr>
        <td>${c.Elder1Name} &amp; ${c.Elder2Name}</td>
        <td>${leader.Name || '—'}</td>
        <td style="color: #c00;">● Pending</td>
        <td><span class="copy-link">${url}</span></td>
      </tr>
    `;
  }).join('');
}

function renderAllRows_() {
  const quarter = getCurrentQuarter();
  const comps = getCompanionshipsByQuarter(quarter);
  const leaders = getAllLeaders();
  const leaderMap = Object.fromEntries(leaders.map(l => [l.LeaderId, l]));

  return comps.map(c => {
    const leader = leaderMap[c.AssignedLeaderId] || {};
    const bookedAt = c.BookedAt ? new Date(c.BookedAt).toLocaleString('en-US', { timeZone: TIMEZONE }) : '—';
    const badge = c.Status === 'Booked' ? '<span style="color: #060;">● Booked</span>'
                : c.Status === 'Completed' ? '<span style="color: #888;">● Completed</span>'
                : '<span style="color: #c00;">● Pending</span>';
    return `
      <tr>
        <td>${c.Elder1Name} &amp; ${c.Elder2Name}</td>
        <td>${leader.Name || '—'}</td>
        <td>${badge}</td>
        <td>${bookedAt}</td>
      </tr>
    `;
  }).join('');
}
