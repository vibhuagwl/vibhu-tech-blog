#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${KAFKA_OAUTH_ISSUER_URI:?Set KAFKA_OAUTH_ISSUER_URI in .env — see docs/OKTA.md}"
: "${KAFKA_OAUTH_TOKEN_ENDPOINT:?Set KAFKA_OAUTH_TOKEN_ENDPOINT in .env}"
: "${KAFKA_OAUTH_JWKS_ENDPOINT:?Set KAFKA_OAUTH_JWKS_ENDPOINT in .env}"
: "${KAFKA_BROKER_CLIENT_ID:?Set KAFKA_BROKER_CLIENT_ID in .env}"
: "${KAFKA_BROKER_CLIENT_SECRET:?Set KAFKA_BROKER_CLIENT_SECRET in .env}"

export KAFKA_KEYSTORE_PASSWORD="${KAFKA_KEYSTORE_PASSWORD:-changeit}"
export KAFKA_TRUSTSTORE_PASSWORD="${KAFKA_TRUSTSTORE_PASSWORD:-changeit}"
export KAFKA_KEY_PASSWORD="${KAFKA_KEY_PASSWORD:-changeit}"
export OAUTH_PRINCIPAL_CLAIM="${OAUTH_PRINCIPAL_CLAIM:-azp}"

if [[ ! -f certificates/kafka.truststore.p12 ]]; then
  ./scripts/create-certs.sh
fi

cat > scripts/admin.properties <<EOF
security.protocol=SASL_SSL
sasl.mechanism=OAUTHBEARER
sasl.login.callback.handler.class=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginCallbackHandler
sasl.oauthbearer.token.endpoint.url=${KAFKA_OAUTH_TOKEN_ENDPOINT}
sasl.jaas.config=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required clientId="${KAFKA_BROKER_CLIENT_ID}" clientSecret="${KAFKA_BROKER_CLIENT_SECRET}" scope="kafka";
ssl.truststore.location=${ROOT}/certificates/kafka.truststore.p12
ssl.truststore.password=${KAFKA_TRUSTSTORE_PASSWORD}
ssl.truststore.type=PKCS12
ssl.endpoint.identification.algorithm=https
EOF

docker compose --env-file .env -f docker/docker-compose.yml up -d

echo "Waiting for Okta Kafka authorization server..."
okta_ok=0
for _ in $(seq 1 20); do
  if curl -sf "${KAFKA_OAUTH_ISSUER_URI}/.well-known/oauth-authorization-server" >/dev/null; then
    okta_ok=1
    break
  fi
  sleep 2
done
if [[ "$okta_ok" -ne 1 ]]; then
  echo "Could not reach ${KAFKA_OAUTH_ISSUER_URI}. Check docs/OKTA.md and network access from this machine." >&2
  exit 1
fi

echo "Okta Kafka issuer: ${KAFKA_OAUTH_ISSUER_URI}"
echo "Kafka SASL_SSL: localhost:9093"
echo "Wrote scripts/admin.properties from .env (not committed)."
echo "Next: create topics + ACLs, then run the Spring Boot app (see README)."
