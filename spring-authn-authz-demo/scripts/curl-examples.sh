#!/usr/bin/env bash
set -euo pipefail
BASE="${API_BASE:-http://localhost:8081}"

echo "== unauthenticated =="
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/accounts/me"

echo "== alice me =="
curl -s -u alice:password "$BASE/api/accounts/me"; echo

echo "== alice admin (expect 403) =="
curl -s -o /dev/null -w "%{http_code}\n" -u alice:password "$BASE/api/admin/stats"

echo "== admin stats =="
curl -s -u admin:password "$BASE/api/admin/stats"; echo
