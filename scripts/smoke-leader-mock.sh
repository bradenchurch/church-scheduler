#!/usr/bin/env bash
# MOCK_AUTH smoke test for church-scheduler leader routes.
# Exercises: GET /api/bookings/cole, GET /api/slots/cole,
# GET /api/leader/cole/ical-token (admin), and a forbidden non-admin path.
set -euo pipefail

cd "$(dirname "$0")/.."

# Load Supabase env (values redacted in logs; sourced into the shell).
set -a
# shellcheck disable=SC1091
source ~/.openclaw/workspace/.secrets/church-scheduler.env
set +a

PORT="${PORT:-3108}"
BASE="http://localhost:${PORT}"
LOG="/tmp/cs-smoke-server.log"

# Start the server with MOCK_AUTH enabled.
MOCK_AUTH=true PORT="$PORT" node server/index.js >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

# Wait for the server to come up.
for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

echo "=== 1. GET /api/bookings/cole as admin (expect 200 + JSON array) ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}' \
  "$BASE/api/bookings/cole"

echo ""
echo "=== 2. GET /api/slots/cole as admin (expect 200 + JSON array) ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}' \
  "$BASE/api/slots/cole"

echo ""
echo "=== 3. GET /api/leader/cole/ical-token as admin (expect 200 + token) ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}' \
  "$BASE/api/leader/cole/ical-token"

echo ""
echo "=== 4. GET /api/bookings/cole as NON-admin leader with wrong leader_id (expect 403) ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'X-Mock-User: {"id":"00000000-0000-0000-0000-000000000002","email":"sean@example.com","role":"leader","leader_id":"sean"}' \
  "$BASE/api/bookings/cole"

echo ""
echo "=== 5. GET /api/leader/cole/ical-token as NON-admin leader with wrong leader_id (expect 403) ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H 'X-Mock-User: {"id":"00000000-0000-0000-0000-000000000002","email":"sean@example.com","role":"leader","leader_id":"sean"}' \
  "$BASE/api/leader/cole/ical-token"

echo ""
echo "=== 6. GET /api/bookings/cole WITHOUT X-Mock-User (expect 401) ==="
curl -s -w "\nHTTP %{http_code}\n" "$BASE/api/bookings/cole"

echo ""
echo "=== server log tail ==="
tail -n 20 "$LOG"
