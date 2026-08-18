#!/usr/bin/env bash
# MOCK_AUTH smoke test for the admin-management-tools endpoints:
#   GET  /api/admin/welcome-links  (admin only)
#   GET  /api/admin/export.csv     (admin + leader)
#   POST /api/admin/import-roster  (admin only; upsert)
#   GET  /api/admin/analytics      (admin + leader; regression guard)
#
# The import success-path test performs an IDEMPOTENT update of a known seeded
# companionship (Austin Behymer & Bridger Tower -> Cole) using name-only CSV, so
# it never inserts a new row and never wipes existing emails. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

# Load Supabase env (values redacted in logs; sourced into the shell).
set -a
# shellcheck disable=SC1091
source ~/.openclaw/workspace/.secrets/church-scheduler.env
set +a

PORT="${PORT:-3114}"
BASE="http://localhost:${PORT}"
LOG="/tmp/cs-admin-tools-smoke.log"

MOCK_AUTH=true PORT="$PORT" node server/index.js >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

ADMIN_HDR='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000001","email":"braden@example.com","role":"admin","leader_id":"braden"}'
LEADER_HDR='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000002","email":"sean@example.com","role":"leader","leader_id":"sean"}'
COMPANION_HDR='X-Mock-User: {"id":"00000000-0000-0000-0000-000000000003","email":"companion@example.com","role":"companion","leader_id":null}'

# Wait for the server to come up.
for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

echo "=== 1. GET /api/admin/welcome-links without auth — expect 401 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/admin/welcome-links"

echo ""
echo "=== 2. GET /api/admin/welcome-links as leader — expect 403 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "$LEADER_HDR" "$BASE/api/admin/welcome-links"

echo ""
echo "=== 3. GET /api/admin/welcome-links as admin — expect 200 + 3 leaders ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HDR" "$BASE/api/admin/welcome-links"

echo ""
echo "=== 4. GET /api/admin/export.csv without auth — expect 401 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE/api/admin/export.csv"

echo ""
echo "=== 5. GET /api/admin/export.csv as companion — expect 403 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "$COMPANION_HDR" "$BASE/api/admin/export.csv"

echo ""
echo "=== 6. GET /api/admin/export.csv as admin — expect 200 + CSV header ==="
curl -s -w "\nHTTP %{http_code}\n" -H "$ADMIN_HDR" "$BASE/api/admin/export.csv" | head -n 4

echo ""
echo "=== 7. POST /api/admin/import-roster without auth — expect 401 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H 'Content-Type: application/json' \
  -d '{"csv":"Companion 1,Companion 2\nA,B\n"}' \
  "$BASE/api/admin/import-roster"

echo ""
echo "=== 8. POST /api/admin/import-roster as leader — expect 403 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "$LEADER_HDR" -H 'Content-Type: application/json' \
  -d '{"csv":"Companion 1,Companion 2\nA,B\n"}' \
  "$BASE/api/admin/import-roster"

echo ""
echo "=== 9. POST /api/admin/import-roster as admin, empty CSV — expect 400 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$ADMIN_HDR" -H 'Content-Type: application/json' \
  -d '{"csv":""}' \
  "$BASE/api/admin/import-roster"

echo ""
echo "=== 10. POST /api/admin/import-roster as admin, header-only CSV — expect 400 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$ADMIN_HDR" -H 'Content-Type: application/json' \
  -d '{"csv":"Companion 1,Companion 2,Assigned Leader / District\n"}' \
  "$BASE/api/admin/import-roster"

echo ""
echo "=== 11. POST /api/admin/import-roster as admin, idempotent update — expect 200 added:0 updated:1 ==="
curl -s -w "\nHTTP %{http_code}\n" \
  -H "$ADMIN_HDR" -H 'Content-Type: application/json' \
  -d '{"csv":"Companion 1,Companion 2,Assigned Leader / District\nAustin Behymer,Bridger Tower,Cole\n"}' \
  "$BASE/api/admin/import-roster"

echo ""
echo "=== 12. GET /api/admin/analytics as admin (regression guard) — expect 200 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "$ADMIN_HDR" "$BASE/api/admin/analytics"

echo ""
echo "=== server log tail ==="
tail -n 20 "$LOG"
