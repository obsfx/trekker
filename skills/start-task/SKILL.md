---
name: start-task
description: "Start tracked work the right way: search first, restore task context, check dependencies, then mark the task in progress."
---

# Start Task

Use this skill when the user wants to begin working on a Trekker task.

## Required Flow

```bash
trekker search "refresh"
trekker task show TREK-12
trekker history --entity TREK-12
trekker comment list TREK-12
trekker dep list TREK-12
trekker task update TREK-12 -s in_progress
```

## What to Surface

After starting the task, summarize:

- The task goal
- Relevant prior comments or history
- Existing blockers or dependencies
- Any nearby tasks found during search

If the task id is not known, inspect current `in_progress` and `ready` tasks before choosing one.
