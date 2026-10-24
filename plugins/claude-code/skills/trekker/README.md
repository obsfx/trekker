# Trekker Skill

This skill teaches Claude how to use trekker for persistent task tracking across sessions.

## Overview

Trekker is an issue tracker designed for AI coding agents. It stores tasks, epics, and dependencies in a local SQLite database, providing memory that persists beyond conversation context limits.

## CRITICAL: Search-First Workflow

**You don't remember previous sessions.** `trekker search` restores that context.

```bash
# ALWAYS run before ANY action
trekker search "<keywords>"
```

**When to search:**
- Before creating tasks (check for duplicates/related work)
- Before starting work (find past decisions and solutions)
- Before investigating issues (find previous investigations)
- When context is unclear (STOP → SEARCH → RESUME)

## When to Use

Use trekker when:
- Working on multi-step projects that span multiple sessions
- Tasks have dependencies on each other
- You need to preserve context across context resets
- Collaborating with other agents on the same project

**Important:** Do NOT perform multi-step work without an active trekker issue.

Use TodoWrite when:
- Simple linear checklists within a single session
- No need to persist beyond the conversation
- Quick one-off task lists

## Key Concepts

### Tasks
Main work units with IDs like `TREK-1`. Have title, description, priority, status, and optional tags.

### Epics
Groups of related tasks with IDs like `EPIC-1`. Use for features or milestones.

### Subtasks
Child tasks under a parent task. Created with `trekker subtask create <parent-id>`.

### Comments
Attached to tasks for documentation. Use for progress updates, analysis notes, and checkpoints.

### Dependencies
Task-to-task relationships. `trekker dep add TREK-2 TREK-1` means TREK-2 depends on TREK-1.

## Installation

```bash
npm install -g @obsfx/trekker
trekker init
```

## More Information

- Full CLI reference: `trekker quickstart`
- Project repo: https://github.com/obsfx/trekker
