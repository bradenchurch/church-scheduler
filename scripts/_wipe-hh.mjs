import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/bradenchurch/.openclaw/workspace/.secrets/church-scheduler.env', 'utf8');
const cfg = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => {
  const k = l.split('=')[0].trim();
  return [k, l.slice(l.indexOf('=') + 1).trim()];
}));
const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_KEY);

// Wipe links first, then households (FK-safe order).
const { error: linkErr } = await supabase.from('companionship_households').delete().not('companionship_id', 'is', null);
const { error: hhErr } = await supabase.from('households').delete().not('id', 'is', null);
console.log('  Links deleted:', linkErr ? 'ERR ' + linkErr.message : 'OK');
console.log('  Households deleted:', hhErr ? 'ERR ' + hhErr.message : 'OK');

const { count: hhCount } = await supabase.from('households').select('*', { count: 'exact', head: true });
const { count: linkCount } = await supabase.from('companionship_households').select('*', { count: 'exact', head: true });
const { count: compCount } = await supabase.from('companionships').select('*', { count: 'exact', head: true });
console.log('  households:', hhCount, 'links:', linkCount, 'companionships:', compCount);
