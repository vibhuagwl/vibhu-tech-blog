#!/usr/bin/env bash
# Phase 1 smoke: hit Gateway → User / Order (services must already be running).
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"

echo "== public ping =="
curl -sS "$BASE/api/public/ping" | tee /tmp/gw-ping.json
echo

echo "== users via gateway =="
curl -sS -D - "$BASE/api/users/101" -o /tmp/gw-user.json | head -20
cat /tmp/gw-user.json
echo

echo "== orders via gateway =="
curl -sS -D - "$BASE/api/orders/5001" -o /tmp/gw-order.json | head -20
cat /tmp/gw-order.json
echo

echo "OK — Phase 1 paths work if JSON shows user-service / order-service"
