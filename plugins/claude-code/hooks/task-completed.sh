#!/bin/bash
# Stop/SubagentStop hook: Sync task completion to Trekker
# Fires when Claude (main agent or subagent) finishes its work.
# Best-effort: silently exits if trekker is not initialized or no match found.

set -euo pipefail

# Check if trekker is initialized
if [ ! -d ".trekker" ]; then
  exit 0
fi

# Check if jq is available
if ! command -v jq &>/dev/null; then
  exit 0
fi

# Read input from stdin
input=$(cat)

# Extract task subject
task_subject=$(echo "$input" | jq -r '.task_subject // empty')

if [ -z "$task_subject" ]; then
  exit 0
fi

# Extract distinctive keywords (skip stop words and common verbs)
# FTS5 is not semantic - use single keywords for best recall
keywords=$(echo "$task_subject" | tr '[:upper:]' '[:lower:]' | \
  sed 's/[^a-z0-9 ]//g' | \
  tr ' ' '\n' | \
  grep -vE '^(the|a|an|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|for|and|nor|but|or|yet|so|at|by|in|of|on|to|up|with|from|into|that|this|it|its|fix|add|update|implement|create|remove|delete|make|set|get|new|all|not|no|run|use|check|test|write|read|build)$' | \
  head -3)

if [ -z "$keywords" ]; then
  exit 0
fi

# Search trekker for matching in-progress tasks using single keywords
for keyword in $keywords; do
  # Skip very short keywords
  [ ${#keyword} -lt 3 ] && continue

  results=$(trekker search "$keyword" --type task --status in_progress 2>/dev/null || true)
  task_id=$(echo "$results" | grep -oE 'TREK-[0-9]+' | head -1 || true)

  if [ -n "$task_id" ]; then
    trekker comment add "$task_id" -a "claude" -c "Auto-synced: completed via Stop hook. Claude task: $task_subject" 2>/dev/null || true
    trekker task update "$task_id" -s completed 2>/dev/null || true
    echo "Trekker sync: marked $task_id as completed"
    echo ""
    echo "## Next Ready Tasks"
    echo ""
    trekker --toon ready 2>/dev/null || echo "No ready tasks found."
    exit 0
  fi
done

exit 0
