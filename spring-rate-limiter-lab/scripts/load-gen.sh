#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8098}"
ALGORITHM="${ALGORITHM:-TOKEN_BUCKET}"
LAB_KEY="${LAB_KEY:-load-gen}"
TOTAL="${TOTAL:-30}"
COST="${COST:-1}"

allowed=0
rejected=0

for i in $(seq 1 "$TOTAL"); do
  body=$(curl -sS "${BASE_URL}/api/lab/${ALGORITHM}?cost=${COST}" -H "X-Lab-Key: ${LAB_KEY}")
  if echo "$body" | grep -q '"allowed":true'; then
  allowed=$((allowed + 1))
  else
    rejected=$((rejected + 1))
  fi
done

echo "load-gen: algorithm=${ALGORITHM} total=${TOTAL} allowed=${allowed} rejected=${rejected}"
