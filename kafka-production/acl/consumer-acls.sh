#!/usr/bin/env bash
# Consumer ACLs — topic READ + consumer group READ (both required)
set -euo pipefail
BOOT="${KAFKA_BOOTSTRAP:-kafka1.internal:9093}"
ADMIN_CONFIG="${KAFKA_ADMIN_CONFIG:-../kafka/client.properties}"

# payment-consumer: read payment-events + join payment-group
kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:payment-consumer \
  --operation Read --topic payment-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:payment-consumer \
  --operation Read --group payment-group

# order-consumer
kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:order-consumer \
  --operation Read --topic order-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:order-consumer \
  --operation Read --group order-group

# reporting-consumer (read-only analytics)
kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:reporting-consumer \
  --operation Read --topic payment-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:reporting-consumer \
  --operation Read --topic order-events

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:reporting-consumer \
  --operation Read --group reporting-group

echo "Consumer ACLs applied."
