---
name: find-duplicates
description: Check Trekker for related tasks before creating a new one so work is extended instead of duplicated.
---

# Find Duplicates

Run this workflow before any new task creation.

## Workflow

1. Search with the most distinctive keyword from the proposed task.
2. Search again with one adjacent keyword if needed.
3. Review existing tasks, comments, and status.
4. Decide whether to update, link, or create.

## Example

```bash
trekker search "oauth" --type task,subtask --limit 5
trekker search "token" --type task,subtask --limit 5
```

If a matching or clearly related task exists, continue that thread instead of opening a duplicate.
