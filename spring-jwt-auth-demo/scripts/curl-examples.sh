#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://127.0.0.1:8092}"

echo "== register =="
curl -sS -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"newuser@example.com","password":"StrongPassword123!"}'
echo

echo "== login user =="
LOGIN=$(curl -sS -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"StrongPassword123!"}')
echo "$LOGIN"
ACCESS=$(echo "$LOGIN" | python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])')
REFRESH=$(echo "$LOGIN" | python3 -c 'import json,sys; print(json.load(sys.stdin)["refreshToken"])')

echo "== GET /api/users/me =="
curl -sS "$BASE/api/users/me" -H "Authorization: Bearer $ACCESS"
echo

echo "== GET /api/admin/users as USER (expect 403) =="
curl -sS -o /dev/stderr -w "%{http_code}\n" "$BASE/api/admin/users" -H "Authorization: Bearer $ACCESS"

echo "== login admin =="
ADMIN=$(curl -sS -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"StrongPassword123!"}')
ADMIN_ACCESS=$(echo "$ADMIN" | python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])')

echo "== GET /api/admin/users as ADMIN =="
curl -sS "$BASE/api/admin/users" -H "Authorization: Bearer $ADMIN_ACCESS"
echo

echo "== refresh =="
curl -sS -X POST "$BASE/api/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
echo

echo "== logout =="
curl -sS -o /dev/stderr -w "%{http_code}\n" -X POST "$BASE/api/auth/logout" \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
