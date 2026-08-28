#!/usr/bin/env bash
# Create SCRAM users — run once per cluster (requires admin client.properties)
set -euo pipefail
BOOT="${KAFKA_BOOTSTRAP:-kafka1.internal:9093}"
ADMIN_CONFIG="${KAFKA_ADMIN_CONFIG:-../kafka/client.properties}"

create_user() {
  local user="$1"
  local pass_env="$2"
  local pass="${!pass_env:?Set $pass_env}"
  kafka-configs --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
    --alter --add-config "SCRAM-SHA-512=[password=${pass}]" \
    --entity-type users --entity-name "$user"
  echo "Created SCRAM user: $user"
}

create_user payment-producer KAFKA_PAYMENT_PRODUCER_PASSWORD
create_user payment-consumer KAFKA_PAYMENT_CONSUMER_PASSWORD
create_user order-producer KAFKA_ORDER_PRODUCER_PASSWORD
create_user order-consumer KAFKA_ORDER_CONSUMER_PASSWORD
create_user reporting-consumer KAFKA_REPORTING_CONSUMER_PASSWORD
