---
name: trekker:start
description: Start working on a task
---

Begin working on a task by setting its status to in_progress.

**IMPORTANT**: `/trekker:start` is a skill (invoke via Skill tool), NOT a bash command. There is no `trekker start` CLI command. Use `trekker task update` as shown below.

## Arguments

- `$1`: Task ID (e.g., TREK-1) - optional

If no task ID provided:
1. Show current in_progress tasks
2. Show ready tasks (todo status)
3. Ask which task to start

## Execution

### Step 1: Search for Related Work (MANDATORY)

**Before starting ANY task, search for related context:**

```bash
# Search for related past work using keywords from the task
trekker search "<task title keywords>"
trekker search "<related concepts>"

# Check completed tasks that might inform this work
trekker --toon task list --status completed
```

**Why search first:**
- Past tasks may contain solutions you need
- Reveals related work and file locations
- Prevents re-doing solved problems
- **Prefer continuity over re-implementation**

### Step 2: Gather Full Context via CLI (MANDATORY)

```bash
# Show task details
trekker task show <task-id>

# View change history for this task
trekker history --entity <task-id>

# Get comments for context
trekker comment list <task-id>

# Check dependencies
trekker dep list <task-id>
```

**Why this matters:**
- Understand previous work on this task
- See if it was started/stopped before
- Recall decisions and blockers from past sessions
- **If context is unclear: STOP → SEARCH MORE → RESUME**

### Step 3: Start the Task

```bash
# Set status to in_progress
trekker task update <task-id> -s in_progress
```

## After Starting

Display a summary including:
- Task title and description
- Key points from history/comments
- Related tasks found via search
- Any dependencies or blockers
