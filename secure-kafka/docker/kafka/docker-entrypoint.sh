#!/bin/sh
set -eu
TEMPLATE=/mnt/shared/config/server.properties
OUT=/tmp/server.properties
cp "$TEMPLATE" "$OUT"
for var in KAFKA_KEYSTORE_PASSWORD KAFKA_KEY_PASSWORD KAFKA_TRUSTSTORE_PASSWORD \
           KAFKA_BROKER_CLIENT_ID KAFKA_BROKER_CLIENT_SECRET \
           OAUTH_JWKS_ENDPOINT OAUTH_TOKEN_ENDPOINT OAUTH_ISSUER_URI OAUTH_PRINCIPAL_CLAIM; do
  eval val=\$$var
  sed -i "s|\${${var}}|${val}|g" "$OUT"
done
mkdir -p /tmp/kraft-combined-logs
if [ ! -f /tmp/kraft-combined-logs/meta.properties ]; then
  /opt/kafka/bin/kafka-storage.sh format --ignore-formatted -t "${CLUSTER_ID}" -c "$OUT"
fi
exec /opt/kafka/bin/kafka-server-start.sh "$OUT"
