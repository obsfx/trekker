---
name: task-sync
description: Keep Trekker as the source of truth while using Codex session planning as a temporary mirror.
---

# Task Sync

Use this skill when the user wants both durable tracking and an in-session checklist.

## Source of Truth

```text
Trekker = persistent record
update_plan = session-local mirror
```

When they diverge, Trekker wins.

## Sync Rules

1. Create or update Trekker first.
2. Reflect the current execution plan in `update_plan` only after Trekker is correct.
3. If Codex work uncovers new scope, update Trekker before refreshing the session plan.
4. Never rely on `update_plan` to preserve long-term task history, blockers, or summaries.

## Example

```bash
trekker task update TREK-8 -s in_progress
trekker comment add TREK-8 -a "codex" -c "Checkpoint: narrowed the issue to the pagination query in src/services/list.ts."
```

Then update the session plan so the current conversation reflects the tracked task. Do not skip the Trekker update.
