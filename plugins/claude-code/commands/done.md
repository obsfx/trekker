---
name: trekker:done
description: Complete a task with summary
---

Mark a task as completed with a summary comment.

**IMPORTANT**: `/trekker:done` is a skill (invoke via Skill tool), NOT a bash command. There is no `trekker done` CLI command. Use `trekker task update` as shown below.

## Arguments

- `$1`: Task ID (e.g., TREK-1) - optional

If no task ID provided:
1. Show current in_progress tasks
2. Ask which task to complete

## CRITICAL: Summary Comment is MANDATORY

**Never mark a task complete without a detailed summary comment.** Future sessions depend on this context.

**Good summary includes:**
- What was done (specific changes)
- Which files were modified
- Any decisions made
- Links to related tasks if any

## Flow

1. Review task history for context: `trekker history --entity <task-id>`
2. Ask for a completion summary (what was done, files changed, decisions made)
3. Add detailed summary comment
4. Set status to completed
5. Show ready tasks to find next work

## Execution

```bash
# Review task history first
trekker history --entity <task-id>

# Add detailed summary comment (MANDATORY)
trekker comment add <task-id> -a "claude" -c "Summary: <what was done>. Files: <modified files>. Changes: <specific changes>."

# Mark as completed
trekker task update <task-id> -s completed

# ALWAYS show ready tasks after completing work
trekker --toon ready
```
