#!/usr/bin/env bash
set -euo pipefail

export PII_ENCRYPTION_KEY="${PII_ENCRYPTION_KEY:-$(openssl rand -base64 32)}"
export DB_PASSWORD="${DB_PASSWORD:-local-dev-only}"
export API_BASIC_PASSWORD="${API_BASIC_PASSWORD:-support-secret}"
export PII_ADMIN_PASSWORD="${PII_ADMIN_PASSWORD:-pii-admin-secret}"

BASE="http://localhost:8085"

echo "== Create customer (PII encrypted at rest) =="
CREATE=$(curl -s -u support:support-secret -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Doe","email":"jane.doe@bank.com","ssn":"123-45-6789","panLast4":"4242"}' \
  "$BASE/api/customers")
echo "$CREATE"
ID=$(echo "$CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "== Masked read (ROLE_SUPPORT) =="
curl -s -u support:support-secret "$BASE/api/customers/$ID" | jq .

echo ""
echo "== Full PII denied for support =="
curl -s -u support:support-secret "$BASE/api/customers/$ID?fullPii=true" | jq .

echo ""
echo "== Full PII read (ROLE_PII_ADMIN) =="
curl -s -u piiadmin:pii-admin-secret "$BASE/api/customers/$ID?fullPii=true" | jq .
