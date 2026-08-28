#!/usr/bin/env bash
# Generate CA + broker + client certificates for Kafka TLS/mTLS
# Usage: ./generate-certs.sh <output-dir>
# NEVER commit generated keys or passwords to Git
set -euo pipefail

OUT="${1:-../certificates}"
mkdir -p "$OUT"
DAYS=825
CA_PASS="${CA_PASS:-change-me-use-secrets-manager}"
KEYSTORE_PASS="${KEYSTORE_PASS:-change-me-use-secrets-manager}"

echo "Generating CA in $OUT (passwords from env — not stored in repo)"

# 1) CA private key + self-signed CA cert
openssl genrsa -out "$OUT/ca.key" 4096
openssl req -new -x509 -days "$DAYS" -key "$OUT/ca.key" -out "$OUT/ca.crt" \
  -subj "/CN=Kafka-Production-CA/O=ExampleFinTech/C=US" \
  -passin pass:"$CA_PASS" 2>/dev/null || \
openssl req -new -x509 -days "$DAYS" -key "$OUT/ca.key" -out "$OUT/ca.crt" \
  -subj "/CN=Kafka-Production-CA/O=ExampleFinTech/C=US"

# 2) Broker keystore (server cert)
for HOST in kafka1.internal kafka2.internal kafka3.internal; do
  openssl genrsa -out "$OUT/${HOST}.key" 2048
  openssl req -new -key "$OUT/${HOST}.key" -out "$OUT/${HOST}.csr" \
    -subj "/CN=${HOST}/O=Kafka/O=ExampleFinTech/C=US"
  openssl x509 -req -in "$OUT/${HOST}.csr" -CA "$OUT/ca.crt" -CAkey "$OUT/ca.key" \
    -CAcreateserial -out "$OUT/${HOST}.crt" -days "$DAYS"
  openssl pkcs12 -export -in "$OUT/${HOST}.crt" -inkey "$OUT/${HOST}.key" \
    -out "$OUT/${HOST}.p12" -name "$HOST" -password pass:"$KEYSTORE_PASS"
  keytool -importkeystore -destkeystore "$OUT/${HOST}.keystore.jks" \
    -srckeystore "$OUT/${HOST}.p12" -srcstoretype PKCS12 \
    -alias "$HOST" -deststorepass "$KEYSTORE_PASS" -srcstorepass "$KEYSTORE_PASS" -noprompt
done

# 3) Truststore with CA
keytool -importcert -alias kafka-ca -file "$OUT/ca.crt" \
  -keystore "$OUT/truststore.jks" -storepass "$KEYSTORE_PASS" -noprompt

# 4) Client cert for mTLS (payment-producer example)
openssl genrsa -out "$OUT/payment-producer.key" 2048
openssl req -new -key "$OUT/payment-producer.key" -out "$OUT/payment-producer.csr" \
  -subj "/CN=payment-producer/O=PaymentService/C=US"
openssl x509 -req -in "$OUT/payment-producer.csr" -CA "$OUT/ca.crt" -CAkey "$OUT/ca.key" \
  -CAcreateserial -out "$OUT/payment-producer.crt" -days "$DAYS"
openssl pkcs12 -export -in "$OUT/payment-producer.crt" -inkey "$OUT/payment-producer.key" \
  -out "$OUT/payment-producer.p12" -name payment-producer -password pass:"$KEYSTORE_PASS"
keytool -importkeystore -destkeystore "$OUT/payment-producer.keystore.jks" \
  -srckeystore "$OUT/payment-producer.p12" -srcstoretype PKCS12 \
  -alias payment-producer -deststorepass "$KEYSTORE_PASS" -srcstorepass "$KEYSTORE_PASS" -noprompt

echo "Done. Import truststore.jks to all clients. Mount keystores via K8s Secrets / Secrets Manager."
echo "Add ca.crt to .gitignore — only scripts belong in Git."
