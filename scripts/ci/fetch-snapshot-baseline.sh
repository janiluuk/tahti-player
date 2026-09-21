#!/usr/bin/env bash
# Puts master's snapshot digest in ./snapshot-baseline/digest.json so the PR
# digest can list only what this PR changed (see build-snapshot-digest.mjs).
#
#   fetch-snapshot-baseline.sh <workflow file> <artifact name>
#
# The latest *finished* master run of that workflow uploads its digest only
# when it had snapshot mismatches, so a run without the artifact means master
# was clean and the baseline is empty. If no master run can be found at all
# nothing is written and the digest falls back to listing every mismatch.
# Needs GH_TOKEN and `actions: read`.
set -euo pipefail

workflow="${1:?workflow file, e.g. ci.yml}"
artifact="${2:?artifact name, e.g. snapshot-digest}"

run_id=$(gh run list --workflow "$workflow" --branch master --limit 20 \
  --json databaseId,status,conclusion \
  --jq '[.[] | select(.status == "completed" and (.conclusion == "success" or .conclusion == "failure"))][0].databaseId // empty')

if [ -z "$run_id" ]; then
  echo "No finished master run of $workflow found; listing every mismatch as new."
  exit 0
fi

rm -rf snapshot-baseline
if gh run download "$run_id" -n "$artifact" -D snapshot-baseline 2>/dev/null; then
  echo "Using master run $run_id ($workflow) as the snapshot baseline."
else
  echo "Master run $run_id has no $artifact artifact (it had no mismatches): empty baseline."
  mkdir -p snapshot-baseline
  echo '{"items":[],"standing":[]}' > snapshot-baseline/digest.json
fi
