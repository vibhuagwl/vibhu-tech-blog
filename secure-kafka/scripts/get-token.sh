#!/usr/bin/env bash
set -euo pipefail
TOKEN_URL="${OAUTH_TOKEN_ENDPOINT:?Set OAUTH_TOKEN_ENDPOINT (Okta payment-api authorization server /v1/token)}"
CLIENT_ID="${1:-${PAYMENT_API_CLIENT_ID:?pass client id or set PAYMENT_API_CLIENT_ID}}"
CLIENT_SECRET="${2:-${PAYMENT_API_CLIENT_SECRET:?pass client secret or set PAYMENT_API_CLIENT_SECRET}}"
SCOPE="${3:-payment:write}"

BODY="grant_type=client_credentials"
if [[ -n "$SCOPE" ]]; then
  BODY="${BODY}&scope=${SCOPE}"
fi

curl -sS -X POST "$TOKEN_URL" \
  -u "${CLIENT_ID}:${CLIENT_SECRET}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "$BODY" | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])'
