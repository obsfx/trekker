---
name: trekker:blocked
description: Mark a task as blocked
---

Mark a task as blocked when it cannot proceed.

**IMPORTANT**: `/trekker:blocked` is a skill (invoke via Skill tool), NOT a bash command. There is no `trekker blocked` CLI command. Use `trekker task update` as shown below.

## Arguments

- `$1`: Task ID (e.g., TREK-1) - optional

If no task ID provided, show in_progress tasks and ask which to mark as blocked.

## Flow

1. Ask for the blocking reason
2. Add comment explaining the blocker
3. Set status to wont_fix (or keep as todo with comment)

## Execution

```bash
# Add blocker comment
trekker comment add <task-id> -a "claude" -c "Blocked: <reason>"

# Optionally update status
trekker task update <task-id> -s wont_fix
```

## Note

Consider using `wont_fix` for external blockers or keeping as `todo` with a blocker comment for temporary blocks.
