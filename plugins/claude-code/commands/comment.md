---
name: trekker:comment
description: Add a comment to a task
---

Add a comment to document progress or context.

**IMPORTANT**: `/trekker:comment` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker comment add` CLI as shown below.

## Arguments

- `$1`: Task ID (e.g., TREK-1) - optional

If no task ID provided, ask which task to comment on.

## Flow

1. Ask for the comment content
2. Add the comment with agent name "claude"

## Execution

```bash
trekker comment add <task-id> -a "claude" -c "<content>"
```

## Comment Types

Suggest appropriate comment prefixes:
- `Analysis:` - for investigation findings
- `Progress:` - for work updates
- `Summary:` - for completion summaries
- `Checkpoint:` - for context preservation before breaks
- `Blocked:` - for blockers
