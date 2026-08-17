#!/usr/bin/env bash
# MOCK_AUTH smoke test for the new batch availability endpoint.
# Exercises: POST /api/availability/:leaderId/windows/batch (success + cleanup),
# and the auth/validation gates (401 / 403 / 400).
# NOTE: inserts far-future test windows then deletes them in the same run,
# so the production DB is left exactly as it was.
set -euo pipefail

cd "$(dirname "$0")/.."

# Load Supabase env (values redacted in logs; sourced into the shell).
set -a
# shellcheck disable=SC1091
source ~/.openclaw/workspace/.secrets/church-scheduler.env
set +a

PORT="${PORT:-3112}"
BASE="http://localhost:${PORT}"
LOG="/tmp/cs-batch-smoke.log"

MOCK_AUTH=true PORT="$PORT" node server/index.js >"$LOG" 2>&1 &
SERVER_PID=$!

ADMIN_HDR='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}'
OTHER_HDR='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000002","email":"sean@example.com","role":"leader","leader_id":"sean"}'

# Collect created window ids for cleanup.
CREATED_IDS=""

cleanup() {
  for id in $CREATED_IDS; do
    curl -s -o /dev/null -X DELETE \
      -H "$ADMIN_HDR" \
      "$BASE/api/availability/windows/$id" || true
  done
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for the server to come up.
for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

extract_ids() {
  echo "$1" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//' | tr '\n' ' '
}

echo "=== 1. POST batch (admin, 2 far-future windows for cole) — expect 201 + array of 2 ==="
RESP1=$(curl -s \
  -H "$ADMIN_HDR" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[{"window_date":"2031-01-05","start_time":"13:00","end_time":"15:00","slot_duration_minutes":30},{"window_date":"2031-01-12","start_time":"13:00","end_time":"15:00","slot_duration_minutes":30}]}' \
  "$BASE/api/availability/cole/windows/batch")
echo "$RESP1"
IDS1=$(extract_ids "$RESP1")
CREATED_IDS="$IDS1"

echo ""
echo "=== 2. POST batch (owner leader sean -> sean) — expect 201 ==="
RESP2=$(curl -s \
  -H "$OTHER_HDR" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[{"window_date":"2031-01-26","start_time":"18:00","end_time":"20:00"}]}' \
  "$BASE/api/availability/sean/windows/batch")
echo "$RESP2"
IDS2=$(extract_ids "$RESP2")
CREATED_IDS="$CREATED_IDS $IDS2"

echo ""
echo "=== 3. POST batch (admin, empty windows array) — expect 400 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$ADMIN_HDR" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[]}' \
  "$BASE/api/availability/cole/windows/batch"

echo ""
echo "=== 4. POST batch (admin, invalid date in windows[0]) — expect 400 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$ADMIN_HDR" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[{"window_date":"not-a-date","start_time":"13:00","end_time":"15:00"}]}' \
  "$BASE/api/availability/cole/windows/batch"

echo ""
echo "=== 5. POST batch (non-admin leader sean -> cole) — expect 403 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$OTHER_HDR" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[{"window_date":"2031-01-19","start_time":"13:00","end_time":"15:00"}]}' \
  "$BASE/api/availability/cole/windows/batch"

echo ""
echo "=== 6. POST batch (no auth header) — expect 401 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'Content-Type: application/json' \
  -d '{"windows":[{"window_date":"2031-01-19","start_time":"13:00","end_time":"15:00"}]}' \
  "$BASE/api/availability/cole/windows/batch"

echo ""
echo "=== cleanup will delete ids: $CREATED_IDS ==="
echo ""
echo "=== server log tail ==="
tail -n 20 "$LOG"
