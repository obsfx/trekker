---
name: search
description: Search Trekker first to recover context before creating, starting, or updating tracked work.
---

# Search First

Trekker search is the primary context recovery tool.

## FTS5 Rules

- Use one distinctive keyword at a time.
- Multi-word queries use AND logic and often miss relevant items.
- Try a few adjacent keywords instead of one long phrase.

## Good Queries

```bash
trekker search "auth"
trekker search "migration"
trekker search "release"
```

## Bad Queries

```bash
trekker search "fix the authentication bug in login"
trekker search "what changed in the release flow"
```

## When to Use

- Before creating tasks
- Before starting tracked work
- When resuming work after a reset
- When investigating bugs or prior decisions

If search results are thin, broaden with a second keyword and inspect nearby tasks via comments and history.
