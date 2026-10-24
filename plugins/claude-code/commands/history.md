---
name: trekker:history
description: View audit log of changes to understand what happened in past sessions
---

View the audit trail of all changes (creates, updates, deletes) to recover context from past sessions.

**IMPORTANT**: `/trekker:history` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker history` CLI as shown below.

## Why Use History

- **Session start**: Understand what happened since you last worked
- **Before modifying**: See who changed what and when
- **Conflict debugging**: Track down when/how something changed
- **Context recovery**: Remember decisions from previous sessions

## Arguments

- `$1`: Entity ID (optional, e.g., TREK-1) - filter to specific entity

## Execution

```bash
# Default: Recent changes across all entities
trekker history --limit 15

# For specific entity (if ID provided)
trekker history --entity <entity-id>

# For session context (combine with filters)
trekker history --type task --action update --limit 20
```

## Common Patterns

### Session Start Context Recovery
```bash
# What happened recently?
trekker history --limit 15

# Focus on task changes
trekker history --type task --limit 10
```

### Before Modifying a Task
```bash
# See change history for this task
trekker history --entity TREK-1
```

### Understanding Recent Activity
```bash
# Only creates (new items)
trekker history --action create --limit 10

# Only updates (status changes, edits)
trekker history --action update --limit 10

# Changes since a date
trekker history --since 2025-01-15
```

## Output Interpretation

Each history entry shows:
- **Timestamp**: When the change occurred
- **Entity**: Which task/epic/subtask was affected
- **Action**: create, update, or delete
- **Changes**: What specifically changed (for updates)

## After Viewing

If history reveals:
- **Stale in_progress tasks**: Check if they should be completed or updated
- **Recent completions**: Review comments for context on what was done
- **Conflicts**: Use `trekker task show <id>` to see current state
