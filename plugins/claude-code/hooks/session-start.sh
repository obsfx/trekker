#!/bin/bash
# Session start hook: Load trekker state for new sessions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/utils.sh"

exit_unless_trekker_cli

if [ ! -d ".trekker" ]; then
    echo "Trekker: not initialized. Run \`trekker init\`."
    exit 0
fi

# Fetch state
TODO_OUTPUT=$(trekker --toon task list --status todo --limit 1 2>/dev/null)
IN_PROG_OUTPUT=$(trekker --toon task list --status in_progress --limit "$CONTEXT_TASK_LIMIT" 2>/dev/null)
EPIC_OUTPUT=$(trekker --toon epic list --limit 1 2>/dev/null)

TODO=$(echo "$TODO_OUTPUT" | get_toon_count); TODO=${TODO:-0}
IN_PROG=$(echo "$IN_PROG_OUTPUT" | get_toon_count); IN_PROG=${IN_PROG:-0}
EPIC_COUNT=$(echo "$EPIC_OUTPUT" | get_toon_count); EPIC_COUNT=${EPIC_COUNT:-0}

echo "# Trekker Session Context"
echo ""
echo "**State**: $IN_PROG in-progress | $TODO todo | $EPIC_COUNT epics"
echo ""

# Rules (compact — details in CLAUDE.md and skills)
echo "CRITICAL: Track work with the \`trekker\` CLI through Bash (NOT TaskCreate/TaskUpdate/TodoWrite). Add \`--toon\` for structured output. MANDATORY: Search (\`trekker search \"<keyword>\"\`) before any action."
echo ""

# In-progress work with context
if [ "$IN_PROG" -gt 0 ]; then
    echo "## In-Progress Work"
    echo ""
    for task_id in $(echo "$IN_PROG_OUTPUT" | get_toon_task_ids); do
        print_task_context "$task_id"
    done
    print_more_in_progress "$IN_PROG"
    echo ""
elif [ "$TODO" -gt 0 ]; then
    echo "## Ready Tasks"
    echo ""
    trekker --toon ready --limit "$CONTEXT_TASK_LIMIT" 2>/dev/null || trekker --toon task list --status todo --limit "$CONTEXT_TASK_LIMIT" 2>/dev/null
    echo ""
else
    echo "No pending tasks. Create: \`trekker task create -t \"title\"\`"
    echo ""
fi

# Recent activity (3 items for token efficiency)
echo "## Recent Activity (last 3)"
echo ""
trekker --toon history --limit 3 2>/dev/null || echo "No recent history."
echo ""

# Footer
echo "---"
echo ""
echo "Workflow: \`in_progress\`->work->comment->\`completed\`->\`trekker ready\`"
echo "Search: \`trekker search \"<keyword>\"\` | Guide: \`trekker quickstart\`"
