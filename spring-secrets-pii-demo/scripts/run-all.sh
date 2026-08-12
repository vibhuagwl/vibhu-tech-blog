#!/usr/bin/env bash
# Start all 3 PII microservices locally (requires Java 21 + Maven)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export PII_ENCRYPTION_KEY="${PII_ENCRYPTION_KEY:-$(openssl rand -base64 32)}"
export DB_PASSWORD="${DB_PASSWORD:-local-dev-only}"
export SERVICE_CLIENT_PASSWORD="${SERVICE_CLIENT_PASSWORD:-service-secret}"
export API_BASIC_PASSWORD="${API_BASIC_PASSWORD:-support-secret}"
export PII_ADMIN_PASSWORD="${PII_ADMIN_PASSWORD:-pii-admin-secret}"
export COMPLIANCE_PASSWORD="${COMPLIANCE_PASSWORD:-compliance-secret}"
export CUSTOMER_SERVICE_URL="${CUSTOMER_SERVICE_URL:-http://localhost:8085}"
export AUDIT_SERVICE_URL="${AUDIT_SERVICE_URL:-http://localhost:8087}"

cd "$ROOT"
mvn -q install -DskipTests

echo "Starting audit-service :8087 ..."
mvn -q -pl audit-service spring-boot:run &
PID_AUDIT=$!

echo "Starting customer-service :8085 ..."
mvn -q -pl customer-service spring-boot:run &
PID_CUST=$!

sleep 12

echo "Starting support-api :8086 ..."
mvn -q -pl support-api spring-boot:run &
PID_SUPPORT=$!

cleanup() {
  kill "$PID_SUPPORT" "$PID_CUST" "$PID_AUDIT" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Waiting for support-api health..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8086/actuator/health >/dev/null 2>&1; then
    echo "All services up. Run: bash scripts/curl-microservices.sh"
    wait "$PID_SUPPORT"
    exit 0
  fi
  sleep 2
done
echo "Timeout waiting for services" >&2
exit 1
