import { safeNextPath, todayInTimeZone } from '../../shared/availability.js';

export { safeNextPath };

export async function upcomingWindowCount(accessToken, leaderId) {
  if (!accessToken || !leaderId) return 0;
  const res = await fetch(`/api/availability/${leaderId}/windows`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({}));
  const today = todayInTimeZone();
  return (data.windows || []).filter((row) => String(row.window_date).slice(0, 10) >= today).length;
}

export function landingForRole({ role, upcomingCount }) {
  if (role === 'admin') return '/admin';
  if (role === 'leader') return upcomingCount === 0 ? '/availability' : '/leader';
  return '/';
}
