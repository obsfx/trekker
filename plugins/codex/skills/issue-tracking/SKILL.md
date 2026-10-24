---
name: issue-tracking
description: Suggest or manage Trekker tracking when the user talks about bugs, features, backlog items, or work that should survive this session.
---

# Issue Tracking

Use this skill when the conversation shifts from discussion into tracked work.

## Required Behavior

1. Ask before creating or changing tracked issues unless the user has already asked you to do it.
2. Search for duplicates before creating anything new.
3. Prefer updating an existing task when it already covers the work.

## Duplicate Check

```bash
trekker search "pagination" --type task,subtask --limit 5
trekker search "cursor" --type task,subtask --limit 5
```

Use single keywords. Trekker search is full-text, not semantic.

## Creation Pattern

```bash
trekker task create -t "Fix pagination cursor regression" -d "Investigate duplicate results in cursor pagination under filtered list view." -p 1
```

## Update Pattern

```bash
trekker comment add TREK-14 -a "codex" -c "Checkpoint: reproduced duplicate results when sorting by updated_at."
```

If Trekker is not initialized in the current workspace, ask before running `trekker init`.
