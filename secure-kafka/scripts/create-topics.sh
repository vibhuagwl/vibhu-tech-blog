#!/usr/bin/env bash
set -euo pipefail
BOOTSTRAP="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9093}"
COMMAND_CONFIG="${KAFKA_COMMAND_CONFIG:-$(cd "$(dirname "$0")/.." && pwd)/scripts/admin.properties}"

kafka-topics.sh --bootstrap-server "$BOOTSTRAP" --command-config "$COMMAND_CONFIG" \
  --create --if-not-exists --topic payments --partitions 3 --replication-factor 1

kafka-topics.sh --bootstrap-server "$BOOTSTRAP" --command-config "$COMMAND_CONFIG" \
  --create --if-not-exists --topic payments.DLT --partitions 3 --replication-factor 1
