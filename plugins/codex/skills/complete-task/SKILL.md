---
name: complete-task
description: Close Trekker work cleanly by reviewing context, adding a summary comment, marking the task complete, and surfacing the next ready item.
---

# Complete Task

Never mark a task complete without a summary comment.

## Required Flow

```bash
trekker history --entity TREK-12
trekker comment add TREK-12 -a "codex" -c "Summary: implemented the retry guard in src/service.ts and removed the duplicate fallback path."
trekker task update TREK-12 -s completed
trekker ready
```

## Good Summary Content

- What changed
- Which files or subsystems were touched
- Key decisions or tradeoffs
- Any follow-up work that remains

If the user is finishing only part of the task, leave a `Checkpoint:` comment instead of completing it.
