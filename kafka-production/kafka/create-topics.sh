#!/usr/bin/env bash
# Create production topics with FinTech durability settings
set -euo pipefail
BOOT="${KAFKA_BOOTSTRAP:-kafka1.internal:9093}"
ADMIN_CONFIG="${KAFKA_ADMIN_CONFIG:-../kafka/client.properties}"

create_topic() {
  local name="$1"
  local partitions="$2"
  kafka-topics --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
    --create --if-not-exists \
    --topic "$name" \
    --partitions "$partitions" \
    --replication-factor 3 \
    --config min.insync.replicas=2 \
    --config retention.ms=604800000 \
    --config compression.type=producer \
    --config cleanup.policy=delete
}

create_topic payment-events 12
create_topic order-events 12
create_topic transaction-events 24
create_topic audit-events 6

echo "Topics created. Verify: kafka-topics --describe --topic payment-events"
