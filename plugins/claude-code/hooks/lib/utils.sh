#!/bin/bash
# Shared utilities for trekker hooks

CONTEXT_TASK_LIMIT=5

exit_unless_trekker_cli() {
    if ! command -v trekker >/dev/null 2>&1; then
        echo "Trekker: CLI not found. Install it with \`npm install -g @obsfx/trekker\` to enable Trekker workflows."
        exit 0
    fi
}

# Extract count from toon format (paginated: "total: N" on first line)
get_toon_count() {
    grep -m1 '^total:' | sed 's/^total:[[:space:]]*//'
}

# Extract task IDs from toon paginated output (items section)
get_toon_task_ids() {
    sed -n 's/^  \([A-Za-z][A-Za-z0-9]*-[0-9][0-9]*\),.*/\1/p'
}

print_more_in_progress() {
    local total="$1"
    if [ "$total" -gt "$CONTEXT_TASK_LIMIT" ]; then
        echo "...and $((total - CONTEXT_TASK_LIMIT)) more in progress: \`trekker task list --status in_progress\`"
    fi
}

# Compact task context: id, title, desc, last 3 comment lines, deps
print_task_context() {
    local id="$1"
    local out=$(trekker --toon task show "$id" 2>/dev/null)
    local title=$(echo "$out" | grep '^title:' | cut -d' ' -f2-)
    local desc=$(echo "$out" | grep '^description:' | cut -d' ' -f2-)

    echo "- $id: $title"
    [ -n "$desc" ] && [ "$desc" != "null" ] && echo "  desc: $desc"

    # Comments: paginated TOON has "items[N]{...}:" header then data rows with leading spaces
    local comment_output=$(trekker --toon comment list "$id" 2>/dev/null)
    local cc=$(echo "$comment_output" | get_toon_count); cc=${cc:-0}
    if [ "$cc" -gt 0 ]; then
        echo "  comments:"
        echo "$comment_output" | grep -E '^  ' | tail -3 | sed 's/^/    /'
    fi

    # Deps: TOON has "dependsOn[N]" and "blocks[N]" sections
    local deps=$(trekker --toon dep list "$id" 2>/dev/null)
    local dep_count=$(echo "$deps" | grep -oE 'dependsOn\[([0-9]+)\]' | grep -oE '[0-9]+')
    dep_count=${dep_count:-0}
    if [ "$dep_count" -gt 0 ]; then
        echo "  deps:"
        echo "$deps" | grep -E '^  ' | sed 's/^/    /'
    fi
}
