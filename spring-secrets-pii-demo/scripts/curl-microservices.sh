#!/usr/bin/env bash
set -euo pipefail

BASE_SUPPORT="http://localhost:8086"
BASE_AUDIT="http://localhost:8087"

echo "== 1. Support agent creates customer (PII encrypted in customer-service) =="
CREATE=$(curl -s -u support:support-secret -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Doe","email":"jane.doe@bank.com","ssn":"123-45-6789","panLast4":"4242"}' \
  "$BASE_SUPPORT/api/customers")
echo "$CREATE"
ID=$(echo "$CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "== 2. Support read — masked (support-api masks before returning) =="
curl -s -u support:support-secret "$BASE_SUPPORT/api/customers/$ID" | python3 -m json.tool

echo ""
echo "== 3. Support requests full PII — 403 =="
curl -s -u support:support-secret "$BASE_SUPPORT/api/customers/$ID?fullPii=true" | python3 -m json.tool

echo ""
echo "== 4. PII admin — full PII + audit event shipped =="
curl -s -u piiadmin:pii-admin-secret "$BASE_SUPPORT/api/customers/$ID?fullPii=true" | python3 -m json.tool

echo ""
echo "== 5. Compliance queries audit trail =="
curl -s -u compliance:compliance-secret "$BASE_AUDIT/internal/audit/customers/$ID" | python3 -m json.tool

echo ""
echo "== 6. Agent cannot hit customer-service directly (internal only) =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -u support:support-secret \
  "http://localhost:8085/internal/customers/$ID"
