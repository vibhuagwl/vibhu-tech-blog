#!/usr/bin/env bash
# Least privilege: separate producer, consumer, admin identities.
set -euo pipefail
BOOTSTRAP="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9093}"
COMMAND_CONFIG="${KAFKA_COMMAND_CONFIG:-$(cd "$(dirname "$0")/.." && pwd)/scripts/admin.properties}"
ACL=(kafka-acls.sh --bootstrap-server "$BOOTSTRAP" --command-config "$COMMAND_CONFIG")

# Super-user kafka-broker is already in broker super.users. Admin CLI uses that identity.

"${ACL[@]}" --add --allow-principal User:payment-producer \
  --operation Write --operation Describe --topic payments

"${ACL[@]}" --add --allow-principal User:payment-consumer \
  --operation Read --operation Describe --topic payments

"${ACL[@]}" --add --allow-principal User:payment-consumer \
  --operation Read --operation Describe --group payment-service

# Consumer error handler publishes poison messages to the DLT with the consumer identity.
"${ACL[@]}" --add --allow-principal User:payment-consumer \
  --operation Write --operation Describe --topic payments.DLT

"${ACL[@]}" --add --allow-principal User:kafka-admin \
  --operation Create --operation Delete --operation Alter --operation Describe \
  --topic '*'

"${ACL[@]}" --add --allow-principal User:kafka-admin \
  --operation Describe --operation Alter --group '*'

echo "ACLs applied. List:"
"${ACL[@]}" --list
