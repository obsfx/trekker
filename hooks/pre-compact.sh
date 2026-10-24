#!/bin/bash
# Pre-compact hook: Preserve trekker state before context compaction

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/utils.sh"

exit_unless_trekker_cli

if [ ! -d ".trekker" ]; then
    echo "Trekker: not initialized."
    exit 0
fi

# Fetch state
TODO_OUTPUT=$(trekker --toon task list --status todo 2>/dev/null)
IN_PROG_OUTPUT=$(trekker --toon task list --status in_progress 2>/dev/null)
COMPLETED_OUTPUT=$(trekker --toon task list --status completed 2>/dev/null)
EPIC_OUTPUT=$(trekker --toon epic list 2>/dev/null)

TODO=$(echo "$TODO_OUTPUT" | get_toon_count); TODO=${TODO:-0}
IN_PROG=$(echo "$IN_PROG_OUTPUT" | get_toon_count); IN_PROG=${IN_PROG:-0}
COMPLETED=$(echo "$COMPLETED_OUTPUT" | get_toon_count); COMPLETED=${COMPLETED:-0}
EPIC_COUNT=$(echo "$EPIC_OUTPUT" | get_toon_count); EPIC_COUNT=${EPIC_COUNT:-0}

echo "# Trekker Pre-Compact State"
echo ""
echo "State: $IN_PROG in-progress | $TODO todo | $COMPLETED completed | $EPIC_COUNT epics"
echo ""

# Active work details (critical to preserve across compaction)
if [ "$IN_PROG" -gt 0 ]; then
    echo "## Active Work"
    echo ""
    for task_id in $(echo "$IN_PROG_OUTPUT" | get_toon_task_ids); do
        print_task_context "$task_id"
    done
    echo ""
fi

# Ready tasks
if [ "$TODO" -gt 0 ]; then
    echo "## Ready Tasks"
    echo ""
    trekker --toon ready 2>/dev/null || trekker --toon task list --status todo 2>/dev/null | head -8
    echo ""
fi

# Recent activity
echo "## Recent (last 3)"
echo ""
trekker --toon history --limit 3 2>/dev/null || echo "No recent history."
echo ""

# Recovery instructions (compact)
echo "---"
echo ""
echo "POST-COMPACT: \`trekker search \"<keyword>\"\` -> \`trekker ready\` -> \`trekker comment list <id>\` -> resume"
echo "Workflow: in_progress->work->comment->completed. Guide: \`trekker quickstart\`"
