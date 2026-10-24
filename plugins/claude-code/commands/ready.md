---
name: trekker:ready
description: Find tasks ready to work on
---

Find unblocked tasks that are ready to be worked on, with full context from recent history.

**IMPORTANT**: `/trekker:ready` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker` CLI as shown below.

## Execution

### Step 1: Search for Context (MANDATORY)

**Before picking work, search for related past work:**

```bash
# Search for what the user is working on
trekker search "<user's current focus area>"

# Search completed tasks for context
trekker search "<keywords>" --status completed
```

**Why search first:**
- Reveals past decisions and solutions you've forgotten
- May find completed work that informs the approach
- Prevents re-investigating solved problems

### Step 2: Context Recovery via CLI (MANDATORY)

```bash
# Check for any in-progress work first
trekker --toon task list --status in_progress

# Review recent changes for context
trekker history --limit 10
```

**Why this matters:**
- Avoid picking up work that's already started
- Understand recent decisions and completions
- Recall context from previous sessions

### Step 3: Find Ready Work

```bash
# Show all unblocked todo tasks with their downstream dependents
trekker --toon ready
```

The `ready` command returns tasks that:
- Have status `todo`
- Are top-level tasks (not subtasks)
- Have no incomplete dependencies blocking them

For each ready task, it also shows **downstream dependents** — tasks that are waiting on it to be completed.

### Step 4: Get Full Context Before Recommending

**For each candidate task, gather context via CLI:**

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

## Prioritization

Present tasks sorted by priority (0=critical first). The `ready` command already returns tasks in priority order.

## After Listing

Ask if the user wants to start working on one of the ready tasks.
If yes, use `/trekker:start <task-id>` workflow.
