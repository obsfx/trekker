---
name: trekker:show
description: Show details of a specific task
---

Show detailed information about a task with full context.

**IMPORTANT**: `/trekker:show` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker task show` CLI as shown below.

## Arguments

- `$1`: Task ID (e.g., TREK-1) - required

If no task ID provided, ask the user which task to show.

## Execution - Gather Full Context via CLI

```bash
# Task details
trekker task show <task-id>

# Change history for this task
trekker history --entity <task-id>

# Comments for context
trekker comment list <task-id>

# Dependencies
trekker dep list <task-id>
```

## Also Consider

Search for related tasks to provide broader context:

```bash
# Search for related work
trekker search "<keywords from task title>"
```
