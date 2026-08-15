#!/usr/bin/env bash
# Phase 3 smoke: hit Gateway repeatedly; expect ≥2 distinct user instances (round-robin).
set -euo pipefail
BASE="${GATEWAY_URL:-http://localhost:8080}"
EUREKA="${EUREKA_URL:-http://localhost:8761}"
N="${REQUESTS:-12}"

echo "== Eureka USER-SERVICE instances =="
python3 - "$EUREKA" <<'PY'
import json, sys, urllib.request
eureka = sys.argv[1].rstrip("/")
req = urllib.request.Request(
    f"{eureka}/eureka/apps/USER-SERVICE",
    headers={"Accept": "application/json"},
)
with urllib.request.urlopen(req) as resp:
    d = json.load(resp)
inst = d["application"]["instance"]
inst = inst if isinstance(inst, list) else [inst]
print(f"count={len(inst)}")
for i in inst:
    port = i.get("port", {})
    port_val = port.get("$") if isinstance(port, dict) else port
    print(f"  id={i.get('instanceId')} port={port_val} status={i.get('status')}")
if len(inst) < 2:
    raise SystemExit("Need >=2 USER-SERVICE instances — run scripts/start-user-2.sh")
PY

echo
echo "== $N requests via gateway (watch instance/port) =="
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
for i in $(seq 1 "$N"); do
  body=$(curl -sS "$BASE/api/users/101")
  printf '%s\n' "$body" | tee -a "$TMP"
done

python3 - "$TMP" <<'PY'
import json, sys, collections
path = sys.argv[1]
rows = []
with open(path) as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
keys = [(r.get("instance"), r.get("port")) for r in rows]
counts = collections.Counter(keys)
print()
print("distribution:")
for k, v in sorted(counts.items()):
    print(f"  instance={k[0]} port={k[1]} -> {v}")
if len(counts) < 2:
    raise SystemExit("FAIL — only one instance seen; LoadBalancer did not rotate")
print(f"OK — Phase 3 round-robin across {len(counts)} instances")
PY
