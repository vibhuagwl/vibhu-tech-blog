#!/usr/bin/env bash
# Prove presentation PRs did not mutate immutable content sources (content/**).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${ROOT}/scripts/content-integrity"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

cd "$ROOT"
find content -type f \( -name '*.mdx' -o -name '*.md' \) | sort | xargs sha256sum > "$TMP"

mkdir -p "$BASE"

if [ ! -f "$BASE/content.mdx.sha256" ]; then
  cp "$TMP" "$BASE/content.mdx.sha256"
  echo "Baseline created ($(wc -l < "$BASE/content.mdx.sha256") files)."
  exit 0
fi

if ! diff -u "$BASE/content.mdx.sha256" "$TMP"; then
  echo "CONTENT INTEGRITY FAILURE: content/** changed. Restore MDX before continuing."
  exit 1
fi

echo "OK — $(wc -l < "$BASE/content.mdx.sha256") content files unchanged."
