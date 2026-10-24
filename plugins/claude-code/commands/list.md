---
name: trekker:list
description: List tasks with optional filters
---

List and explore tasks with powerful filtering and sorting for situational awareness.

**IMPORTANT**: `/trekker:list` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker list` or `trekker task list` CLI as shown below.

## Two List Commands

1. **`trekker list`** - Unified view across epics, tasks, and subtasks
2. **`trekker task list`** - Tasks only

## Common Patterns

### Session Start (MANDATORY Context Recovery)

**Always gather context via CLI before working:**

```bash
# 1. SEARCH for what you're working on
trekker search "<topic/area>"

# 2. Review recent activity
trekker history --limit 10

# 3. All active work, prioritized
trekker list --status todo,in_progress --sort priority:asc

# 4. What's currently being worked on?
trekker --toon task list --status in_progress
```

### Finding Work to Do
```bash
# Ready tasks by priority
trekker list --type task --status todo --sort priority:asc

# Critical and high priority items
trekker list --priority 0,1 --sort priority:asc
```

### Project Overview
```bash
# Everything (all types, all statuses)
trekker list

# Recent items first
trekker list --sort created:desc --limit 20

# Alphabetical for scanning
trekker list --sort title:asc
```

### Filtered Views
```bash
# By status
trekker --toon task list --status <status>

# By epic
trekker --toon task list --epic <epic-id>

# By type
trekker list --type task,subtask --status todo

# Combined filters
trekker list --type task --status in_progress --priority 0,1,2
```

## Filter Options

| Filter | Values |
|--------|--------|
| `--type` | task, subtask, epic |
| `--status` | todo, in_progress, completed, wont_fix, archived |
| `--priority` | 0 (critical) to 5 (someday) |
| `--sort` | priority:asc, created:desc, title:asc |

## Output

Use `--toon` flag for token-efficient output when listing many tasks.

## After Listing

- If in_progress tasks found: verify you should continue or update status
- If many todo tasks: consider prioritizing with `trekker task update <id> -p <priority>`
- If stale tasks: review and update or archive
