#!/bin/bash
# TaskCompleted hook: keep a Claude task open while the Trekker task it names is still in progress.
# Exit code 2 blocks the completion and sends stderr back to Claude.

set -euo pipefail

MAX_REFERENCED_IDS=5

if [ ! -d ".trekker" ] || ! command -v trekker &>/dev/null || ! command -v jq &>/dev/null; then
  exit 0
fi

input=$(cat)
text=$(echo "$input" | jq -r '[.task_subject // "", .task_description // ""] | join(" ")')

ids=$(echo "$text" | grep -oE '[A-Z][A-Z0-9]*-[0-9]+' | awk '!seen[$0]++' | head -"$MAX_REFERENCED_IDS" || true)

pending=()
for id in $ids; do
  status=$(trekker --toon task show "$id" 2>/dev/null | sed -n 's/^status: //p' || true)
  if [ "$status" = "in_progress" ]; then
    pending+=("$id")
  fi
done

if [ ${#pending[@]} -eq 0 ]; then
  exit 0
fi

{
  echo "Trekker ${pending[*]} still in progress. Close it in Trekker before completing this task:"
  for id in "${pending[@]}"; do
    echo "  trekker comment add $id -a \"claude\" -c \"Summary: <what changed, files, follow-ups>\""
    echo "  trekker task update $id -s completed"
  done
} >&2
exit 2
