---
name: smart-query
description: Query tasks using natural language questions.
---

## Critical Rule: Bidirectional Sync

**Trekker and Claude's TodoWrite MUST stay in sync:**
- Trekker change → Update TodoWrite
- TodoWrite change → Update Trekker
- NEVER let them get out of sync

## When to Use

User asks questions like:
- "What's blocking the release?"
- "What did we work on last week?"
- "Are there urgent bugs?"
- "What tasks are stuck?"

## IMPORTANT: FTS5 Search Tips

Trekker search is FTS5 (not semantic). Use **single keywords**, not phrases:
- Multi-word queries require ALL words to match (AND logic)
- Single keywords have better recall
- Search multiple times with different keywords for coverage

## Query Translations

| Natural Language | Command |
|-----------------|---------|
| "What's in progress?" | `trekker task list --status in_progress` |
| "Anything stuck?" | `trekker search "blocked"` |
| "Urgent bugs" | `trekker search "bug" --status todo` |
| "Everything about auth" | `trekker search "authentication"` then `trekker search "login"` |

## Query Patterns

```bash
# Status queries
trekker task list --status todo
trekker task list --status in_progress
trekker task list --status completed

# Priority queries
trekker list --type task --priority 0,1 --status todo

# Search queries - use single keywords (FTS5, not semantic)
trekker search "performance"
trekker search "security"
trekker search "vulnerability"

# Filter search by type or status
trekker search "bug" --type task --status todo

# Relationship queries
trekker dep list TREK-10
trekker task list --epic EPIC-2
```
