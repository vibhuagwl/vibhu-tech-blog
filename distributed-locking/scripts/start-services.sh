#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export LOCK_SERVICE_URL="${LOCK_SERVICE_URL:-http://localhost:8081}"
export ACCOUNT_SERVICE_URL="${ACCOUNT_SERVICE_URL:-http://localhost:8082}"
export TRANSACTION_SERVICE_URL="${TRANSACTION_SERVICE_URL:-http://localhost:8083}"
export RECOVERY_SERVICE_URL="${RECOVERY_SERVICE_URL:-http://localhost:8084}"
export KAFKA_BOOTSTRAP_SERVERS="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"

mvn -q -DskipTests package

java -jar lock-service/target/lock-service-1.0.0-SNAPSHOT.jar &
echo $! > /tmp/lock-service.pid
java -jar account-service/target/account-service-1.0.0-SNAPSHOT.jar &
echo $! > /tmp/account-service.pid
java -jar transaction-service/target/transaction-service-1.0.0-SNAPSHOT.jar &
echo $! > /tmp/transaction-service.pid
java -jar recovery-service/target/recovery-service-1.0.0-SNAPSHOT.jar &
echo $! > /tmp/recovery-service.pid
java -jar api-gateway/target/api-gateway-1.0.0-SNAPSHOT.jar &
echo $! > /tmp/api-gateway.pid

echo "Started services. PIDs in /tmp/*-service.pid"
echo "Gateway: http://localhost:8080"
