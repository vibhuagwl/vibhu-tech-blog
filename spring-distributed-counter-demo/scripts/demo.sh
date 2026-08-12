#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8091}"

echo "Checking counter-api health at ${BASE_URL}"
curl -fsS "${BASE_URL}/actuator/health"
echo

echo "Alice likes post-1"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-like-post-1' \
  -d '{"delta":1,"clientRequestId":"alice-like-post-1","action":"LIKE"}'
echo

echo "Retry Alice's same LIKE; value should remain 1"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-like-post-1' \
  -d '{"delta":1,"clientRequestId":"alice-like-post-1","action":"LIKE"}'
echo

echo "Bob likes post-1; value should become 2"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: bob' \
  -H 'Idempotency-Key: bob-like-post-1' \
  -d '{"delta":1,"clientRequestId":"bob-like-post-1","action":"LIKE"}'
echo

echo "Views are not idempotent"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/post-1/increment" \
  -H 'Content-Type: application/json' \
  -d '{"delta":1,"action":"VIEW"}'
echo

echo "Exact shard-sum read"
curl -fsS "${BASE_URL}/api/v1/counters/post-1"
echo

echo "Shard breakdown"
curl -fsS "${BASE_URL}/api/v1/counters/post-1/shards"
echo

echo "Batch read"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/batch" \
  -H 'Content-Type: application/json' \
  -d '{"resourceIds":["post-1","post-2"]}'
echo

echo "Flush local outbox buffer"
curl -fsS -X POST "${BASE_URL}/api/v1/counters/post-1/flush"
echo
