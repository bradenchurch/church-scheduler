import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/bradenchurch/.openclaw/workspace/.secrets/church-scheduler.env', 'utf8');
const cfg = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => {
  const k = l.split('=')[0].trim();
  return [k, l.slice(l.indexOf('=') + 1).trim()];
}));

const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY);

// FK-safe deletion order (children first).
// We use `.not('id', 'is', null)` as a "match every row" predicate since
// Supabase's JS client requires SOME filter on delete.
const wipeOrder = [
  'companionship_households',
  'household_members',
  'households',
  'companionships',
  'chapel_submissions',
  'qr_requests',
  'bookings',
  'availability_windows',
  'slots',
];

for (const t of wipeOrder) {
  const { error } = await supabase.from(t).delete().not('id', 'is', null);
  if (error) {
    console.log('  ' + t.padEnd(28) + ' ERROR: ' + error.message);
  } else {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log('  ' + t.padEnd(28) + ' remaining=' + count);
  }
}

console.log('\\n=== Final state ===');
for (const t of wipeOrder) {
  const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
  console.log('  ' + t.padEnd(28) + ' ' + count);
}

const { data: leaders } = await supabase.from('leaders').select('id, name, role').order('id');
console.log('\\nLeaders preserved:');
leaders.forEach(l => console.log('  ' + l.id.padEnd(10) + ' ' + (l.role || '').padEnd(10) + ' ' + l.name));
