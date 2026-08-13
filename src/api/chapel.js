// Chapel-side companion flow API helpers (anonymous, no auth required).

export async function submitChapelForm(payload) {
  const res = await fetch('/api/chapel/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || 'Submission failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getAvailability(leaderId) {
  const res = await fetch(`/api/availability/${encodeURIComponent(leaderId)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || 'Failed to load availability');
    err.status = res.status;
    throw err;
  }
  return data;
}
