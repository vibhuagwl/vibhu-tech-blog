#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8088}"

json_field() {
  python3 -c 'import json,sys; print(json.load(sys.stdin)[sys.argv[1]])' "$1"
}

echo "Checking message-service health at ${BASE_URL}"
curl -fsS "${BASE_URL}/actuator/health"
echo

echo "Register Alice and Bob"
curl -fsS -X POST "${BASE_URL}/api/v1/users" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"alice","displayName":"Alice","phone":"+15550001"}'
echo
curl -fsS -X POST "${BASE_URL}/api/v1/users" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","displayName":"Bob","phone":"+15550002"}'
echo

echo "Mark Bob online through a gateway heartbeat"
curl -fsS -X POST "${BASE_URL}/api/v1/presence/heartbeat" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","deviceId":"bob-phone-1","gatewayNode":"gw-local-1"}'
echo

echo "Create direct conversation"
conversation_json="$(curl -fsS -X POST "${BASE_URL}/api/v1/conversations/direct" \
  -H 'Content-Type: application/json' \
  -d '{"userA":"alice","userB":"bob"}')"
echo "${conversation_json}"
conversation_id="$(printf '%s' "${conversation_json}" | json_field conversationId)"

echo "Alice sends an opaque encrypted payload"
message_json="$(curl -fsS -X POST "${BASE_URL}/api/v1/conversations/${conversation_id}/messages" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-client-msg-1' \
  -d '{"clientMsgId":"alice-client-msg-1","recipientId":"bob","encryptedPayload":"opaque-ciphertext-from-alice"}')"
echo "${message_json}"
server_msg_id="$(printf '%s' "${message_json}" | json_field serverMsgId)"

echo "Retry same clientMsgId; serverMsgId should be unchanged"
curl -fsS -X POST "${BASE_URL}/api/v1/conversations/${conversation_id}/messages" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-client-msg-1' \
  -d '{"clientMsgId":"alice-client-msg-1","recipientId":"bob","encryptedPayload":"opaque-ciphertext-from-alice"}'
echo

echo "Bob syncs from serverSeq 0"
curl -fsS "${BASE_URL}/api/v1/conversations/${conversation_id}/messages?afterSeq=0" \
  -H 'X-User-Id: bob'
echo

echo "Bob ACKs delivered"
curl -fsS -X POST "${BASE_URL}/api/v1/messages/${server_msg_id}/acks" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","deviceId":"bob-phone-1","type":"DELIVERED"}'
echo
