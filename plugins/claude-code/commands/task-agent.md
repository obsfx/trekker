---
name: trekker:task-agent
description: Autonomous agent that finds ready work and completes it
---

Run as an autonomous task agent that finds ready work and completes it without user intervention.

**IMPORTANT**: `/trekker:task-agent` is a skill (invoke via Skill tool), NOT a bash command.

## Mode

This is an **autonomous** workflow. Once started, work through tasks until:
- All ready tasks are completed
- A task requires user input/decision
- An external blocker is encountered

## Workflow Cycle

### 1. Discovery

Find unblocked tasks ready for work:

```bash
# Check for in-progress work first (resume if exists)
trekker --toon task list --status in_progress

# Find ready tasks by priority
trekker --toon task list --status todo
```

Prioritize by:
- Priority (0=critical first, then 1=high, etc.)
- Skip tasks with incomplete dependencies

### 2. Engagement

Select a task and prepare:

```bash
# Get full task details
trekker task show <task-id>

# Check for existing comments/context
trekker comment list <task-id>

# Mark as in progress
trekker task update <task-id> -s in_progress
```

### 3. Execution

Complete the work according to the task description:

- Follow project coding standards
- Make minimal, focused changes
- Document significant decisions

### 4. Documentation

Track discoveries and related work:

```bash
# Create tasks for discovered bugs or improvements
trekker task create -t "New issue title" -d "description"

# Link dependencies if needed
trekker dep add <new-task-id> <original-task-id>

# Add progress comments for complex work
trekker comment add <task-id> -a "claude" -c "Progress: ..."
```

### 5. Closure

Complete the task properly:

```bash
# Add summary comment (required before completion)
trekker comment add <task-id> -a "claude" -c "Summary: implemented X in files A, B"

# Mark as completed
trekker task update <task-id> -s completed
```

### 6. Iteration

Return to Discovery phase for the next task.

## Rules

1. **Always set status to `in_progress` before starting work**
2. **Always add a summary comment before marking complete**
3. **Create new tasks for discovered bugs** - don't scope creep
4. **Stop and ask user if**:
   - Task requirements are unclear
   - Multiple valid approaches exist
   - External action is needed (e.g., API keys, permissions)
5. **Mark tasks `wont_fix` if blocked** by external factors

## Context Preservation

Before ending or if context is getting long:

```bash
trekker comment add <task-id> -a "claude" -c "Checkpoint: done X. Next: Y. Files: a.ts, b.ts"
```
