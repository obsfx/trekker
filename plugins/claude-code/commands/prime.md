---
name: trekker:prime
description: Load trekker workflow context
---

Load the trekker workflow context and command reference.

**IMPORTANT**: `/trekker:prime` is a skill (invoke via Skill tool), NOT a bash command.

## Execution

### Step 1: Load Quickstart Guide

```bash
trekker --toon quickstart
```

This command provides:
- Essential trekker commands
- Workflow rules (set status, add comments)
- Status values and priority scale

### Step 2: Gather Current Context via CLI

After loading the guide, ALWAYS gather context:

```bash
# Search for what you're about to work on
trekker search "<topic>"

# Check current state
trekker --toon task list --status in_progress
trekker --toon task list --status todo

# Review recent activity
trekker history --limit 10
```

**Remember:** You don't have memory across sessions. Use CLI commands to restore context before doing any work.
