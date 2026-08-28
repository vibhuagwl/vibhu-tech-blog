#!/usr/bin/env bash
# Producer ACLs — least privilege (NO CLUSTER_ACTION / CREATE / DELETE)
set -euo pipefail
BOOT="${KAFKA_BOOTSTRAP:-kafka1.internal:9093}"
ADMIN_CONFIG="${KAFKA_ADMIN_CONFIG:-../kafka/client.properties}"

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:payment-producer \
  --operation Write --operation IdempotentWrite \
  --topic payment-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:payment-producer \
  --operation Write --operation IdempotentWrite \
  --topic order-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:order-producer \
  --operation Write --operation IdempotentWrite \
  --topic order-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:order-producer \
  --operation Write --operation IdempotentWrite \
  --topic transaction-events

echo "Producer ACLs applied. Verify: kafka-acls --list --principal User:payment-producer"
