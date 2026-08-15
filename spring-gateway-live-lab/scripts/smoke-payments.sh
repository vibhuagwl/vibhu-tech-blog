#!/usr/bin/env bash
# Payment fail-closed demo: SETTLED only from ledger; CB fallback never invents success.
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
KEY="smoke-$(date +%s)"

echo "== balances =="
curl -sS "$BASE/api/payments/accounts/balances"; echo

echo "== POST payment (Idempotency-Key=$KEY) =="
curl -sS -D - -o /tmp/pay.json -X POST "$BASE/api/payments" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"fromAccountId":1001,"toAccountId":1002,"amount":25.00}' | head -20
cat /tmp/pay.json; echo

STATUS=$(python3 -c "import json; print(json.load(open('/tmp/pay.json'))['status'])")
if [[ "$STATUS" != "SETTLED" && "$STATUS" != "FAILED_CLOSED" && "$STATUS" != "REJECTED" ]]; then
  echo "Unexpected status=$STATUS"; exit 1
fi
if [[ "$STATUS" == "SETTLED" ]]; then
  echo "OK — ledger committed SETTLED (strong path)"
elif [[ "$STATUS" == "FAILED_CLOSED" ]]; then
  echo "OK — fail-closed fallback (circuit open); NOT settled — retry same key when healthy"
fi

echo "== idempotent retry same key =="
curl -sS -X POST "$BASE/api/payments" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"fromAccountId":1001,"toAccountId":1002,"amount":25.00}'; echo
