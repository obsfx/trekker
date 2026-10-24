---
name: search
description: PRIMARY tool for gathering context. Search tasks before any action.
---

## CRITICAL: Use This First

**Search is your PRIMARY tool for gathering context.**

Before starting ANY work:
```bash
trekker search "<single keyword>"
```

This finds related past work using FTS5 full-text search.

## IMPORTANT: FTS5 is NOT Semantic Search

Trekker uses FTS5 full-text search, NOT semantic/AI search. This means:

- **Use single, specific keywords** - not phrases or sentences
- **Multi-word queries use AND logic** - `"fix authentication bug"` requires ALL three words present, returning FEWER results
- **Search multiple times** with different keywords for broader coverage
- **Pick the most distinctive word** from what you're looking for

| BAD (too many words) | GOOD (single keyword) |
|----------------------|-----------------------|
| `trekker search "fix login authentication bug"` | `trekker search "authentication"` |
| `trekker search "user cannot access account"` | `trekker search "account"` |
| `trekker search "performance optimization slow"` | `trekker search "performance"` |
| `trekker search "deployment pipeline issues"` | `trekker search "deployment"` |

## When to Use (ALWAYS)

- **Before creating tasks** - find existing work
- **Before starting work** - gather context
- **When investigating issues** - find related bugs
- **When user describes problem** - understand history
- **When resuming work** - recover context

## Commands

```bash
# Search with a single keyword
trekker search "authentication"

# Try multiple keywords separately for broader coverage
trekker search "login"
trekker search "password"

# Filter by type
trekker search "deployment" --type task

# Filter by status
trekker search "memory" --status todo

# Rebuild index if needed
trekker search "caching" --rebuild-index
```

## Workflow: Before ANY Task Operation

```
1. SEARCH: trekker search "<single keyword>"
2. BROADEN: Try 2-3 related keywords if first search has no results
3. REVIEW: Check if similar work exists
4. DECIDE: Update existing OR create new
5. SYNC: Mirror to TodoWrite after Trekker
```

## Trekker is Primary

Remember: Trekker is the source of truth.
- Search Trekker FIRST
- Create in Trekker FIRST
- Then mirror to TodoWrite
