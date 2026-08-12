#!/usr/bin/env bash
set -euo pipefail
AS="${AS:-http://localhost:9000}"
RS="${RS:-http://localhost:8081}"

echo "== Client credentials =="
RESP=$(curl -s -u payment-service:payment-secret \
  -X POST "$AS/oauth2/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&scope=account.read')
echo "$RESP"
TOKEN=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])' <<<"$RESP")

echo "== Account API =="
curl -s "$RS/api/accounts/A-100" -H "Authorization: Bearer $TOKEN"; echo

echo "== Missing token HTTP code =="
curl -s -o /dev/null -w "%{http_code}\n" "$RS/api/payments"
