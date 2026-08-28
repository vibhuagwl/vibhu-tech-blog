#!/usr/bin/env bash
# Admin ACLs — bastion/CI only; time-bound in production
set -euo pipefail
BOOT="${KAFKA_BOOTSTRAP:-kafka1.internal:9093}"
ADMIN_CONFIG="${KAFKA_ADMIN_CONFIG:-../kafka/client.properties}"

# Admin: full cluster ops for platform team (NOT granted to applications)
kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:admin \
  --operation All --cluster

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:admin \
  --operation All --topic '*'

kafka-acls --bootstrap-server "$BOOT" --command-config "$ADMIN_CONFIG" \
  --add --allow-principal User:admin \
  --operation All --group '*'

echo "Admin ACLs applied. NEVER use admin creds in application pods."
