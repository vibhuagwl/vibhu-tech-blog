#!/usr/bin/env bash
# Smoke against AWS-profile stack (compose or ALB).
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"

echo "== ping =="
curl -sS "$BASE/api/public/ping"; echo
echo "== users =="
curl -sS "$BASE/api/users/101"; echo
echo "== orders =="
curl -sS "$BASE/api/orders/5001"; echo
echo "OK — aws profile paths work (no Eureka)"
