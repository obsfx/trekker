---
name: task-sync
description: Synchronize Trekker with Claude's built-in TodoWrite. Trekker is the source of truth.
---

# Task Synchronization: Trekker is Primary

**CRITICAL: Trekker is the PRIMARY task tracker. TodoWrite is secondary.**

Trekker persists across sessions in SQLite. TodoWrite only lives within a conversation.
When they conflict, Trekker wins.

## The Rule

```
Trekker = Source of Truth (survives context resets)
TodoWrite = Session Mirror (conversation-scoped only)
```

## Automatic Sync Behavior

### When Starting a Session

1. Read Trekker state first: `trekker --toon list --type task --status todo,in_progress`
2. Populate TodoWrite from Trekker tasks
3. Never trust TodoWrite from previous sessions - always refresh from Trekker

### When Creating Tasks

```
1. Create in Trekker FIRST:
   trekker task create -t "Title" -d "Description"

2. THEN mirror to TodoWrite:
   TaskCreate with same subject
```

### When Updating Tasks

```
1. Update Trekker FIRST:
   trekker task update TREK-n -s in_progress

2. THEN update TodoWrite:
   TaskUpdate for corresponding todo
```

### When Completing Tasks

```
1. Add summary comment to Trekker:
   trekker comment add TREK-n -a "claude" -c "Summary: ..."

2. Mark complete in Trekker:
   trekker task update TREK-n -s completed

3. Mark complete in TodoWrite:
   TaskUpdate status: completed
```

## Priority Order

| Scenario | Action |
|----------|--------|
| Trekker has task, TodoWrite doesn't | Add to TodoWrite |
| TodoWrite has task, Trekker doesn't | Create in Trekker first |
| Both have task, states differ | Trekker wins, update TodoWrite |
| User creates via TodoWrite | Immediately create in Trekker |

## Why Trekker is Primary

1. **Persistence**: Survives context resets, TodoWrite doesn't
2. **Searchable**: `trekker search` finds past work
3. **Auditable**: `trekker history` shows change trail
4. **Dependencies**: Trekker tracks task relationships
5. **Multi-session**: Work continues across conversations

## Implementation Pattern

Before ANY task operation, think:

```
1. Is this in Trekker? → trekker task show <id>
2. Make change in Trekker FIRST
3. Mirror to TodoWrite AFTER
4. If conflict → Trekker wins
```

## Anti-Patterns (DO NOT DO)

- Creating in TodoWrite without Trekker
- Trusting TodoWrite state from "previous session" (it's gone)
- Updating TodoWrite but forgetting Trekker
- Having tasks in TodoWrite that don't exist in Trekker
