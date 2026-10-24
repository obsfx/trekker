---
name: find-duplicates
description: MANDATORY before creating any task. Use search to detect duplicates and prevent redundant work.
---

## CRITICAL: Search Before Creating ANY Task

**You MUST search before creating any task.**

```bash
trekker search "<task description you're about to create>"
```

## When to Use (MANDATORY)

- **BEFORE creating ANY new task** - non-negotiable
- **User reports issue** - check if already tracked
- **Grooming backlog** - find consolidation opportunities
- **Starting new feature** - find related past work

## IMPORTANT: FTS5 Search Tips

Search uses FTS5 (not semantic). Use **single keywords** for best recall:
- Multi-word queries require ALL words present (AND logic = fewer results)
- Search multiple times with different keywords

## Commands

```bash
# Search with single keywords - try the most distinctive word
trekker search "authentication"
trekker search "login"

# Search specific type
trekker search "timeout" --type task

# Search by status
trekker search "performance" --status todo
```

## MANDATORY Workflow

```
1. SEARCH: trekker search "<single keyword>" (try 2-3 keywords separately)
2. REVIEW results
3. DECIDE:
   - Found exact match: DO NOT create, update the existing task
   - Found related work: review carefully, it may need a link
   - No results: safe to create a new task
4. CREATE in Trekker FIRST (if no duplicate)
5. MIRROR to TodoWrite after
```

## Anti-Patterns (DO NOT)

- Creating task without searching first
- Ignoring search results
- Creating in TodoWrite without checking Trekker first

## Trekker is Primary

Always:
1. Check Trekker for duplicates FIRST
2. Create in Trekker FIRST
3. Then mirror to TodoWrite
