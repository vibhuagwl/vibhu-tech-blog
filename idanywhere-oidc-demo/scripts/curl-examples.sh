#!/usr/bin/env bash
set -euo pipefail
IDA="${IDA_BASE:-http://localhost:9080}"
API="${API_BASE:-http://localhost:8089}"

echo "== OIDC discovery =="
curl -s "$IDA/.well-known/openid-configuration" | head -c 400; echo

echo "== client_credentials =="
TOKEN=$(curl -s -u payments-svc:payments-svc-secret \
  -X POST "$IDA/oauth2/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&scope=api://payments-api/.default' \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
echo "token_len=${#TOKEN}"

echo "== call API =="
curl -s -H "Authorization: Bearer $TOKEN" "$API/api/payments"; echo
