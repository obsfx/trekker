---
name: task-agent
description: Work through Trekker tasks autonomously by recovering context, selecting ready work, documenting progress, and finishing with clean summaries.
---

# Task Agent

Use this skill when the user wants Codex to drive tracked work end to end.

## Workflow

1. Recover context with search, recent history, and any current `in_progress` tasks.
2. Choose a ready task or resume the active one.
3. Read task details, comments, history, and dependencies.
4. Set the task to `in_progress`.
5. Do the work with focused scope.
6. Add progress, checkpoint, or summary comments as appropriate.
7. Mark the task complete only after a real summary comment.
8. Run `trekker ready` to reveal the next unblocked task.

## Discovery Commands

```bash
trekker search "auth"
trekker history --limit 15
trekker task list --status in_progress
trekker ready
```

## Execution Rules

- Search before creating or selecting new work.
- Prefer extending existing tasks over opening new ones.
- Create follow-up tasks for newly discovered scope instead of silently expanding the current task.
- Leave checkpoints whenever work may pause or switch context.
