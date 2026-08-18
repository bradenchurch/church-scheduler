#!/usr/bin/env bash
# MOCK_AUTH smoke test for the executive-secretary suite + double-booking +
# reschedule endpoints.
#
# Exercises (all read-only / auth-gate paths, no data mutation):
#   GET  /api/companionships/:id/active-booking  (admin + missing auth)
#   POST /api/admin/add-admin                     (admin bad-email 400, non-admin 403)
#   POST /api/admin/bookings                      (admin missing-body 400)
#   POST /api/bookings/:id/reschedule             (admin missing booking 404, missing auth 401)
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
source ~/.openclaw/workspace/.secrets/church-scheduler.env
set +a

PORT="${PORT:-3117}"
BASE="http://localhost:${PORT}"
LOG="/tmp/cs-secretary-smoke.log"

MOCK_AUTH=true PORT="$PORT" node server/index.js >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

ADMIN_HEADER='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}'
LEADER_HEADER='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000002","email":"sean@example.com","role":"leader","leader_id":"sean"}'

# Grab a real companionship id from the (anonymous) companionships list.
COMP_ID=$(curl -sf "$BASE/api/companionships" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const j=JSON.parse(d);console.log((j[0]&&j[0].id)||"")}catch{console.log("")}})')
if [ -z "$COMP_ID" ]; then
  echo "!! could not resolve a companionship id — aborting"
  exit 1
fi
echo "Using companionship id: $COMP_ID"

echo ""
echo "=== 1. GET /api/companionships/:id/active-booking as admin (expect 200 + {active:...}) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" "$BASE/api/companionships/$COMP_ID/active-booking"

echo ""
echo "=== 2. GET active-booking WITHOUT X-Mock-User (expect 401) ==="
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/companionships/$COMP_ID/active-booking"

echo ""
echo "=== 3. POST /api/admin/add-admin with invalid email (expect 400) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" -H 'Content-Type: application/json' \
  -d '{"email":"not-an-email"}' "$BASE/api/admin/add-admin"

echo ""
echo "=== 4. POST /api/admin/add-admin as non-admin leader (expect 403) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$LEADER_HEADER" -H 'Content-Type: application/json' \
  -d '{"email":"someone@example.com"}' "$BASE/api/admin/add-admin"

echo ""
echo "=== 5. POST /api/admin/bookings with missing body (expect 400) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" -H 'Content-Type: application/json' \
  -d '{}' "$BASE/api/admin/bookings"

echo ""
echo "=== 6. POST /api/bookings/00000000-0000-0000-0000-000000000000/reschedule as admin (expect 404) ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HEADER" -X POST \
  "$BASE/api/bookings/00000000-0000-0000-0000-000000000000/reschedule"

echo ""
echo "=== 7. POST /api/bookings/:id/reschedule WITHOUT X-Mock-User (expect 401) ==="
curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/api/bookings/00000000-0000-0000-0000-000000000000/reschedule"

echo ""
echo "=== server log tail ==="
tail -n 15 "$LOG"
