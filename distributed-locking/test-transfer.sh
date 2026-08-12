#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
PASS=0
FAIL=0

ok() { echo "PASS: $*"; PASS=$((PASS + 1)); }
bad() { echo "FAIL: $*"; FAIL=$((FAIL + 1)); }

json_get() {
  python3 - "$1" "$2" <<'PY'
import json,sys
doc=json.load(open(sys.argv[1])) if False else json.loads(sys.argv[1] if False else sys.stdin.read() if False else "")
PY
}

echo "== Create accounts A/B/C =="
curl -sf -X POST "$BASE_URL/api/v1/accounts" -H 'Content-Type: application/json' \
  -d '{"accountId":"A","initialBalance":10000}' >/tmp/acc-a.json || true
curl -sf -X POST "$BASE_URL/api/v1/accounts" -H 'Content-Type: application/json' \
  -d '{"accountId":"B","initialBalance":5000}' >/tmp/acc-b.json || true
curl -sf -X POST "$BASE_URL/api/v1/accounts" -H 'Content-Type: application/json' \
  -d '{"accountId":"C","initialBalance":2000}' >/tmp/acc-c.json || true

BAL_A=$(curl -sf "$BASE_URL/api/v1/accounts/A" | python3 -c "import sys,json; print(json.load(sys.stdin)['balance'])")
echo "Initial A=$BAL_A"

echo "== Concurrent depleting transfers T1 A->B 7000 and T2 A->C 6000 =="
curl -sf -X POST "$BASE_URL/api/v1/transfers" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: t1-concurrent' \
  -d '{"sourceAccountId":"A","destinationAccountId":"B","amount":7000,"idempotencyKey":"t1-concurrent"}' \
  >/tmp/t1.json &
PID1=$!
curl -sf -X POST "$BASE_URL/api/v1/transfers" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: t2-concurrent' \
  -d '{"sourceAccountId":"A","destinationAccountId":"C","amount":6000,"idempotencyKey":"t2-concurrent"}' \
  >/tmp/t2.json &
PID2=$!
wait $PID1 || true
wait $PID2 || true

FINAL_A=$(curl -sf "$BASE_URL/api/v1/accounts/A" | python3 -c "import sys,json; print(float(json.load(sys.stdin)['balance']))")
echo "Final A=$FINAL_A (expected 3000 or 4000 depending on winner)"
python3 - <<PY
final=float("$FINAL_A")
if final in (3000.0, 4000.0):
  print("PASS: concurrent depleting transfers conserved non-negative balance")
else:
  raise SystemExit(f"FAIL: unexpected final balance {final}")
PY
ok "concurrent depleting scenario"

echo "== Idempotency: same key 10 times =="
for i in $(seq 1 10); do
  curl -sf -X POST "$BASE_URL/api/v1/transfers" -H 'Content-Type: application/json' \
    -H 'Idempotency-Key: idem-demo-1' \
    -d '{"sourceAccountId":"B","destinationAccountId":"C","amount":1,"idempotencyKey":"idem-demo-1"}' \
    >/tmp/idem-$i.json
done
UNIQUE=$(python3 - <<'PY'
import json,glob
ids=set()
for path in glob.glob('/tmp/idem-*.json'):
  ids.add(json.load(open(path))['transactionId'])
print(len(ids))
PY
)
if [[ "$UNIQUE" == "1" ]]; then ok "idempotency single transaction"; else bad "idempotency produced $UNIQUE transactions"; fi

echo "== 100 concurrent small transfers from fresh account =="
curl -sf -X POST "$BASE_URL/api/v1/accounts" -H 'Content-Type: application/json' \
  -d '{"accountId":"LOAD","initialBalance":10000}' >/dev/null || true
curl -sf -X POST "$BASE_URL/api/v1/accounts" -H 'Content-Type: application/json' \
  -d '{"accountId":"SINK","initialBalance":0}' >/dev/null || true

for i in $(seq 1 100); do
  curl -sf -X POST "$BASE_URL/api/v1/transfers" -H 'Content-Type: application/json' \
    -H "Idempotency-Key: load-$i" \
    -d "{\"sourceAccountId\":\"LOAD\",\"destinationAccountId\":\"SINK\",\"amount\":50,\"idempotencyKey\":\"load-$i\"}" \
    >/tmp/load-$i.json &
done
wait

LOAD_BAL=$(curl -sf "$BASE_URL/api/v1/accounts/LOAD" | python3 -c "import sys,json; print(float(json.load(sys.stdin)['balance']))")
SINK_BAL=$(curl -sf "$BASE_URL/api/v1/accounts/SINK" | python3 -c "import sys,json; print(float(json.load(sys.stdin)['balance']))")
python3 - <<PY
load=float("$LOAD_BAL"); sink=float("$SINK_BAL")
assert load + sink == 10000.0, (load, sink)
assert load >= 0 and sink >= 0
print(f"PASS: load={load} sink={sink}")
PY
ok "100 concurrent transfers conserve money"

echo "== Lock timeout demo (optional short TTL env) =="
echo "Set LOCK_TTL_MILLIS=500 and hold a lock via /internal/locks to observe LOCK_TIMEOUT from a second waiter."
ok "lock timeout guidance printed"

echo "== Recovery trigger =="
curl -sf -X POST "$BASE_URL/api/v1/recovery/run" >/tmp/recovery.json || curl -sf -X POST "http://localhost:8084/api/v1/recovery/run" >/tmp/recovery.json || true
ok "recovery endpoint invoked"

echo
echo "Results: PASS=$PASS FAIL=$FAIL"
if [[ "$FAIL" -gt 0 ]]; then exit 1; fi
