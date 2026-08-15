#!/usr/bin/env bash
# Phase 3 — second user-service replica (same Eureka app id, different port/instance).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SERVER_PORT="${SERVER_PORT:-8083}"
export INSTANCE_ID="${INSTANCE_ID:-user-2}"

echo "Starting user-service replica INSTANCE_ID=$INSTANCE_ID SERVER_PORT=$SERVER_PORT"
echo "Eureka must already be up at http://localhost:8761"
exec mvn -pl user-service spring-boot:run -q
