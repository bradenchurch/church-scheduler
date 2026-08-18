#!/usr/bin/env bash
# End-to-end round-trip for the reschedule + active-booking endpoints.
#
# Creates a throwaway booking directly in the DB (so no calendar/email
# notifications fire), verifies the active-booking banner flips true→false
# around a reschedule call, then deletes the row. No residue left behind.
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source ~/.openclaw/workspace/.secrets/church-scheduler.env
set +a

PORT="${PORT:-3118}"
BASE="http://localhost:${PORT}"
LOG="/tmp/cs-reschedule-rt.log"

MOCK_AUTH=true PORT="$PORT" node server/index.js >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.3
done

ADMIN_HEADER='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}'

COMP_ID=$(curl -sf "$BASE/api/companionships" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);console.log((j[0]&&j[0].id)||"")}catch{console.log("")}})')
if [ -z "$COMP_ID" ]; then echo "!! no companionship id"; exit 1; fi
echo "Companionship: $COMP_ID"

TODAY=$(date +%F)

TEST_BOOKING_ID=$(node --input-type=module -e '
  import { createClient } from "@supabase/supabase-js";
  (async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
    const sb = createClient(url, key);
    const compId = process.argv[1];
    const { data, error } = await sb.from("bookings").insert([{ companionship_id: compId, scheduled_date: process.argv[2], status: "booked" }]).select().single();
    if (error) { console.error("insert error:", error.message); process.exit(1); }
    console.log(data.id);
  })();
' "$COMP_ID" "$TODAY")

if [ -z "$TEST_BOOKING_ID" ]; then echo "!! failed to create test booking"; exit 1; fi
echo "Test booking: $TEST_BOOKING_ID"

cleanup() {
  node --input-type=module -e '
    import { createClient } from "@supabase/supabase-js";
    (async () => {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
      const sb = createClient(url, key);
      const { error } = await sb.from("bookings").delete().eq("id", process.argv[1]);
      if (error) console.error("cleanup error:", error.message);
      else console.log("cleaned up", process.argv[1]);
    })();
  ' "$TEST_BOOKING_ID"
}
trap 'cleanup; kill "$SERVER_PID" 2>/dev/null || true' EXIT

echo ""
echo "=== A. active-booking BEFORE reschedule (expect active:true) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" "$BASE/api/companionships/$COMP_ID/active-booking"

echo ""
echo "=== B. POST reschedule (expect ok + released:true) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" -X POST "$BASE/api/bookings/$TEST_BOOKING_ID/reschedule"

echo ""
echo "=== C. active-booking AFTER reschedule (expect active:false) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" "$BASE/api/companionships/$COMP_ID/active-booking"
