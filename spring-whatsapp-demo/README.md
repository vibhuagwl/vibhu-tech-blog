# Spring WhatsApp-like messaging demo

Runnable Spring Boot 3.4 / Java 21 multi-module demo for the WhatsApp-like messaging path from a system design interview HLD.

This is an interview demo, not real WhatsApp. It does not implement real end-to-end encryption, mobile push, media upload, fanout at production scale, abuse controls, or multi-device key management. The `encryptedPayload` field is intentionally an opaque string.

## Modules

| Module | Port | What it does |
|---|---:|---|
| `whatsapp-common` | n/a | Shared DTOs, enums, topic names, and `MessageCreatedEvent` |
| `message-service` | 8088 | Users, direct conversations, message send/sync, ACKs, presence heartbeat, local delivery coordinator |
| `delivery-worker` | 8089 | Kafka-profile consumer that checks Redis presence and records delivery attempts |

## Design points mapped to the HLD

1. **Persist before delivery**: `message-service` stores the message and an `OutboxRecord` before publishing `MessageCreatedEvent`.
2. **Idempotency**: duplicate sends are keyed by `(senderId, clientMsgId)` and return the same `serverMsgId`.
3. **Ordering**: `serverSeq` increments per `conversationId`.
4. **Internal Kafka**: profile `kafka` uses Spring Kafka; default `local` profile uses Spring application events.
5. **Presence**: default `local` profile uses `ConcurrentHashMap`; `kafka` or `redis` profiles use Redis.
6. **Opaque payloads**: APIs accept `encryptedPayload` as a string and do not perform crypto.

All storage in this demo is in-memory (`ConcurrentHashMap`), including users, conversations, messages, idempotency keys, ACKs, delivery attempts, presence, and the outbox.

## Run tests

```bash
cd spring-whatsapp-demo
mvn -pl message-service test
```

## Run locally without Docker

The default profile is `local`, so no Kafka or Redis is needed.

```bash
cd spring-whatsapp-demo
mvn -q -pl message-service spring-boot:run
```

In another terminal:

```bash
./scripts/demo.sh
```

Health endpoint:

```bash
curl http://localhost:8088/actuator/health
```

## Curl sequence manually

```bash
BASE=http://localhost:8088

curl -X POST "$BASE/api/v1/users" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"alice","displayName":"Alice","phone":"+15550001"}'

curl -X POST "$BASE/api/v1/users" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","displayName":"Bob","phone":"+15550002"}'

curl -X POST "$BASE/api/v1/presence/heartbeat" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","deviceId":"bob-phone-1","gatewayNode":"gw-local-1"}'

CONV_ID=$(curl -s -X POST "$BASE/api/v1/conversations/direct" \
  -H 'Content-Type: application/json' \
  -d '{"userA":"alice","userB":"bob"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["conversationId"])')

MSG_ID=$(curl -s -X POST "$BASE/api/v1/conversations/$CONV_ID/messages" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-client-msg-1' \
  -d '{"clientMsgId":"alice-client-msg-1","recipientId":"bob","encryptedPayload":"opaque-ciphertext-from-alice"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["serverMsgId"])')

# Retry returns the same serverMsgId and serverSeq.
curl -X POST "$BASE/api/v1/conversations/$CONV_ID/messages" \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: alice' \
  -H 'Idempotency-Key: alice-client-msg-1' \
  -d '{"clientMsgId":"alice-client-msg-1","recipientId":"bob","encryptedPayload":"opaque-ciphertext-from-alice"}'

curl "$BASE/api/v1/conversations/$CONV_ID/messages?afterSeq=0" \
  -H 'X-User-Id: bob'

curl -X POST "$BASE/api/v1/messages/$MSG_ID/acks" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"bob","deviceId":"bob-phone-1","type":"DELIVERED"}'
```

## Run with Kafka + Redis

Start infrastructure:

```bash
cd spring-whatsapp-demo
docker compose up -d
```

Run both apps in separate terminals:

```bash
SPRING_PROFILES_ACTIVE=kafka mvn -q -pl message-service spring-boot:run
```

```bash
SPRING_PROFILES_ACTIVE=kafka mvn -q -pl delivery-worker spring-boot:run
```

In this profile, `message-service` publishes `MessageCreatedEvent` to Kafka and `delivery-worker` consumes it. Presence heartbeats are stored in Redis at keys like `presence:bob`.
