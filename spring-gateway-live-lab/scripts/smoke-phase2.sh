#!/usr/bin/env bash
# Phase 2 smoke: Eureka must be up; services registered; Gateway uses lb://
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
EUREKA="${EUREKA_URL:-http://localhost:8761}"

echo "== eureka apps =="
curl -sS -H 'Accept: application/json' "$EUREKA/eureka/apps" | tee /tmp/eureka-apps.json | head -c 400
echo
echo

echo "== public ping =="
curl -sS "$BASE/api/public/ping" | tee /tmp/gw-ping.json
echo

echo "== users via gateway (lb://user-service) =="
curl -sS -D - "$BASE/api/users/101" -o /tmp/gw-user.json | head -20
cat /tmp/gw-user.json
echo

echo "== orders via gateway (lb://order-service) =="
curl -sS -D - "$BASE/api/orders/5001" -o /tmp/gw-order.json | head -20
cat /tmp/gw-order.json
echo

echo "OK — Phase 2 if Eureka lists USER-SERVICE/ORDER-SERVICE and JSON shows downstream services"
