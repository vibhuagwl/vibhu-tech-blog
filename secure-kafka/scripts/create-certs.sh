#!/usr/bin/env bash
# Keystore = this process's identity. Truststore = CAs this process trusts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS="$ROOT/certificates"
PASSWORD="${KAFKA_KEYSTORE_PASSWORD:-${KAFKA_TRUSTSTORE_PASSWORD:-changeit}}"
export KAFKA_KEYSTORE_PASSWORD="${KAFKA_KEYSTORE_PASSWORD:-$PASSWORD}"
export KAFKA_TRUSTSTORE_PASSWORD="${KAFKA_TRUSTSTORE_PASSWORD:-$PASSWORD}"
export KAFKA_KEY_PASSWORD="${KAFKA_KEY_PASSWORD:-$PASSWORD}"

mkdir -p "$CERTS"
rm -f "$CERTS"/*.{p12,crt,key,srl,csr}

openssl req -new -x509 -days 3650 -nodes \
  -subj "/CN=secure-kafka-ca" \
  -keyout "$CERTS/ca.key" \
  -out "$CERTS/ca.crt"

make_identity() {
  local name="$1"
  local cn="$2"
  local san="$3"
  openssl req -new -nodes \
    -subj "/CN=${cn}" \
    -keyout "$CERTS/${name}.key" \
    -out "$CERTS/${name}.csr"
  openssl x509 -req -days 825 -in "$CERTS/${name}.csr" \
    -CA "$CERTS/ca.crt" -CAkey "$CERTS/ca.key" -CAcreateserial \
    -out "$CERTS/${name}.crt" \
    -extfile <(printf "subjectAltName=%s" "$san")
  openssl pkcs12 -export \
    -in "$CERTS/${name}.crt" \
    -inkey "$CERTS/${name}.key" \
    -certfile "$CERTS/ca.crt" \
    -name "$name" \
    -password "pass:${KAFKA_KEYSTORE_PASSWORD}" \
    -out "$CERTS/${name}.keystore.p12"
}

make_identity "kafka.broker" "kafka" "DNS:localhost,DNS:kafka,IP:127.0.0.1"
make_identity "kafka.client" "payment-client" "DNS:localhost,IP:127.0.0.1"

keytool -importcert -noprompt -alias ca -file "$CERTS/ca.crt" \
  -keystore "$CERTS/kafka.truststore.p12" \
  -storetype PKCS12 \
  -storepass "$KAFKA_TRUSTSTORE_PASSWORD"

echo "Wrote PKCS12 material under $CERTS"
echo "  kafka.broker.keystore.p12  — broker identity"
echo "  kafka.client.keystore.p12  — optional client identity (mTLS)"
echo "  kafka.truststore.p12       — trusts the lab CA"
