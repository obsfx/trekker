---
name: trekker
description: Persistent task memory for AI agents across sessions
---

# Trekker - Primary Issue Tracker for AI Agents

**CRITICAL: Trekker is your PRIMARY task tracker. It MUST be prioritized over Claude's built-in TodoWrite.**

Trekker provides persistent task memory across sessions. Unlike TodoWrite which is conversation-scoped, trekker stores tasks in a SQLite database that survives context resets.

## Quick Reference

**Run `trekker quickstart` for the complete command reference and workflow guide.**

## How to Call Trekker

Trekker is a CLI. Run every operation as a `trekker` command through the Bash tool. This plugin ships no MCP tools.

- Add `--toon` before the subcommand for compact, structured output: `trekker --toon task show TREK-1`
- Lists return 50 items per page. Pass `--limit` (and `--page`) to keep output small: `trekker --toon ready --limit 5`
- Check flags with `trekker <command> --help` instead of guessing them
- Quote titles, descriptions, and comments: `trekker comment add TREK-1 -a "claude" -c "Summary: ..."`
- If `trekker` is not on PATH, ask the user to install it: `npm install -g @obsfx/trekker` (requires Bun)

---

## CRITICAL: Trekker Over TodoWrite

```
Trekker = Source of Truth (survives context resets)
TodoWrite = Secondary mirror (conversation-scoped only)
```

**ALWAYS:**
1. Create tasks in Trekker FIRST, then mirror to TodoWrite
2. Update Trekker FIRST, then update TodoWrite
3. When states conflict, Trekker wins
4. Use `trekker search` to gather context
5. Search before creating to detect duplicates

---

## CRITICAL: Search-First Workflow

**You MUST search before ANY action.** This is non-negotiable.

**IMPORTANT: FTS5 is NOT semantic search.** Use single keywords, not phrases:
- Multi-word queries use AND logic (all words must match = fewer results)
- Single keywords have better recall
- Search multiple times with different keywords for coverage

```bash
# Use single, specific keywords (NOT phrases or sentences)
trekker search "authentication"

# Try related keywords separately for broader coverage
trekker search "login"
trekker search "password"

# Filter by type
trekker search "deployment" --type task

# Filter by status
trekker search "memory" --status todo
```

**Why search is mandatory:**
- You don't remember previous sessions - search restores that context
- Past tasks contain solutions, decisions, and file locations you've forgotten
- Prevents duplicate work and conflicting changes
- Reveals blockers and dependencies from previous sessions

**When to search:**
| Before... | Search for... |
|-----------|---------------|
| Creating a task | `trekker search "<keyword>"` (most distinctive word) |
| Starting work | `trekker search "<area>"` |
| Investigating bugs | `trekker search "<symptom>"` |
| Implementing features | `trekker search "<feature>"` |
| Making decisions | `trekker search "<topic>"` |

---

## Trekker vs TodoWrite Priority

| Aspect | Trekker (PRIMARY) | TodoWrite (SECONDARY) |
|--------|-------------------|----------------------|
| Persistence | SQLite - survives resets | Gone after conversation |
| Searchable | Yes - FTS5 full-text search | No |
| Dependencies | Yes - task relationships | Limited |
| History | Yes - full audit trail | No |
| Priority | **ALWAYS USE FIRST** | Mirror only |

**Rule**: Trekker is the source of truth. TodoWrite is a convenience mirror for the current session.

---

## Strict Usage Rules

### CRITICAL: Skills vs CLI Commands

**Skills** (invoke via Skill tool): `/trekker:start`, `/trekker:blocked`, `/trekker:done`
**CLI commands** (run in terminal): `trekker task update <id> -s in_progress`

| WRONG | RIGHT |
|-------|-------|
| `trekker start` | `trekker task update <id> -s in_progress` |
| `trekker blocked` | `trekker comment add <id> -a "claude" -c "Blocked: <reason>"` |
| `trekker done` | `trekker task update <id> -s completed` |

**Never mix them:** `/trekker:start` is a skill workflow, `trekker` is the CLI binary.

### MUST DO

1. **SEARCH FIRST - ALWAYS** - run `trekker search` before ANY action
2. **Gather context via CLI** - use `trekker history`, `trekker comment list`, `trekker task show` to understand state
3. **Set status `in_progress` before starting work** on any task
4. **Add summary comment before marking `completed`**
5. **Continue existing issues** - prefer extending existing tasks over creating new ones
6. **One task `in_progress` at a time** - complete current work first
7. **Use `--toon` flag** for programmatic output to save tokens
8. **Reference tasks by ID** (e.g., TREK-1, EPIC-1) in discussions
9. **Add checkpoint comment before context reset** with: what's done, what's next, files modified
10. **Write meaningful descriptions** - tasks without context are useless to future sessions

### MUST NOT DO

1. **Never invent task IDs** - only use IDs returned by trekker commands
2. **Never overwrite without confirmation** - always show current state before update
3. **Never mark complete without summary** - future sessions depend on this context
4. **Never skip dependency checks** - verify blockers are resolved first
5. **Never assume task exists** - verify with `trekker task show <id>` first
6. **Never delete without explicit user request** - prefer `archived` status

### When to Create Issues

**BEFORE CREATING - You MUST:**
1. Run `trekker search "<keywords>"` to check for existing/related issues
2. Check if an existing issue can be extended instead
3. If similar issue exists, add a comment or update it rather than creating a duplicate

**CREATE** when:
- Search confirms no existing issue covers this work
- Work spans multiple sessions
- Task has dependencies or subtasks
- User explicitly requests tracking
- Bug or feature needs documented investigation
- Work needs to be handed off to another session

**DO NOT CREATE** when:
- Search found an existing issue that covers this work (update it instead)
- Task is trivial (< 1 minute)
- User explicitly declines
- Just exploring or brainstorming
- One-off question or clarification

---

## Essential Workflow

### Session Start (Context Recovery) - MANDATORY

**Run ALL these commands at session start.** Do not proceed without understanding context:

```bash
# 1. SEARCH for what you're about to work on
trekker search "<topic/area of work>"

# 2. What's currently being worked on?
trekker --toon task list --status in_progress

# 3. What changed recently? (audit trail)
trekker history --limit 10

# 4. Find unblocked tasks ready to work on
trekker ready

# 5. Get context from comments on active tasks
trekker comment list <task-id>
```

**Why context recovery is mandatory:**
- You don't remember previous sessions - CLI commands restore that context
- Search reveals past decisions you would otherwise lose
- History shows WHAT changed and WHEN
- Prevents duplicate work and conflicting changes
- **If context is unclear: STOP → SEARCH → RESUME**

### Before ANY New Work - Search First (MANDATORY)

**STOP. Before doing anything, search for related work:**

```bash
# Use single keywords - FTS5 is not semantic, multi-word = AND logic
trekker search "authentication"
trekker search "login"

# Check completed and archived tasks for solutions
trekker search "authentication" --status completed --limit 10
trekker search "authentication" --status archived --limit 10
```

**Why search is mandatory:**
- Past tasks contain solutions and decisions you've forgotten
- Existing issues may already cover what you're about to create
- Find related code changes and file locations
- **Prefer continuity over re-implementation**
- **Prefer extending existing work over starting new threads**

### Working on Tasks

```bash
# Start a task
trekker task update <task-id> -s in_progress

# Document progress
trekker comment add <task-id> -a "claude" -c "Progress: ..."

# Complete with summary
trekker comment add <task-id> -a "claude" -c "Summary: ..."
trekker task update <task-id> -s completed

# ALWAYS show next ready tasks after completing
trekker ready
```

### Before Context Reset

```bash
trekker comment add <task-id> -a "claude" -c "Checkpoint: done X. Next: Y. Files: a.ts, b.ts"
```

### Completing Epics (Keep Board Clean)

When all tasks in an epic are done, use `epic complete` to archive everything at once:

```bash
# Complete epic and archive all its tasks/subtasks
trekker epic complete <epic-id>
```

**Why this matters:**
- Keeps kanban board focused on active work
- Archived tasks remain searchable but don't clutter views
- Single command vs manually archiving each task

**When to use:**
- All tasks under the epic are completed
- Feature/milestone is fully delivered
- User confirms epic is done

---

## Key Commands

| Command | Purpose |
|---------|---------|
| `trekker task create -t "Title"` | Create task |
| `trekker task list [--status X]` | List tasks |
| `trekker task show <id>` | Show details |
| `trekker task update <id> -s <status>` | Update status |
| `trekker comment add <id> -a "claude" -c "..."` | Add comment |
| `trekker dep add <id> <depends-on>` | Add dependency |
| `trekker ready` | Show unblocked tasks ready to work on |
| `trekker search "<query>"` | Full-text search |
| `trekker history [--entity <id>]` | View audit log of changes |
| `trekker list [--type X] [--sort Y]` | Unified view with filters |
| `trekker epic complete <epic-id>` | Complete epic & archive all tasks |

**Need more details?** Run `trekker quickstart` for full command syntax and examples.

---

## History & Audit Trail (Critical for Context)

Use `trekker history` to understand what happened in past sessions:

```bash
# Recent changes across all entities
trekker history --limit 20

# Changes to a specific task
trekker history --entity TREK-1

# Only task updates (filter by type)
trekker history --type task --action update

# Changes since a specific date
trekker history --since 2025-01-15 --limit 30

# Filter by action type
trekker history --action create,update --limit 15
```

**When to use history:**
- Session start - understand recent activity
- Before modifying a task - see its change trail
- Debugging conflicts - who changed what when
- Resuming work - recall context from previous sessions

---

## List Command (Comprehensive Views)

Use `trekker list` for unified views across epics, tasks, and subtasks:

```bash
# All active items, prioritized
trekker list --status todo,in_progress --sort priority:asc

# Critical and high priority work
trekker list --priority 0,1 --sort priority:asc

# Only tasks (no epics/subtasks)
trekker list --type task --status todo

# Sort by creation date (newest first)
trekker list --sort created:desc --limit 20

# Alphabetical by title
trekker list --sort title:asc
```

**Pro tip:** Combine filters for focused views:
```bash
trekker list --type task --status in_progress --priority 0,1,2
```

---

## Status Values

Tasks: `todo`, `in_progress`, `completed`, `wont_fix`, `archived`

## Priority Scale

0=critical, 1=high, 2=medium (default), 3=low, 4=backlog, 5=someday

---

## Task Quality Requirements (MANDATORY)

Future sessions depend entirely on what you write. Low-quality tasks waste time.

### Task Titles - Be Specific

| BAD (vague) | GOOD (actionable) |
|-------------|-------------------|
| "Fix bug" | "Fix null pointer in UserService.getById when user not found" |
| "Add feature" | "Add email validation to registration form with RFC 5322 regex" |
| "Update code" | "Refactor PaymentProcessor to use strategy pattern for providers" |
| "Work on auth" | "Implement JWT refresh token rotation with 7-day expiry" |

### Task Descriptions - Provide Context

Every task MUST have a description (`-d` flag) that answers:
- **What**: What exactly needs to be done?
- **Why**: Why is this needed? What problem does it solve?
- **Where**: Which files/components are involved?

```bash
# BAD
trekker task create -t "Fix login"

# GOOD
trekker task create -t "Fix login failure when password contains special chars" \
  -d "Users with & or < in passwords get 500 error. Issue in auth/validator.ts line 42. Need to escape before SQL query."
```

### Comments - Be Detailed

| BAD | GOOD |
|-----|------|
| "Working on it" | "Progress: Added input sanitization to validator.ts. Testing edge cases next." |
| "Done" | "Summary: Fixed by escaping special chars in sanitizePassword(). Added tests in validator.test.ts. Verified with manual testing." |
| "Stuck" | "Blocked: Need DB admin access to verify fix in staging. Contacted @ops in Slack." |

---

## Multi-Instance Safety

Trekker uses SQLite with a 5-second busy timeout: concurrent writers wait for each other instead of failing, and IDs are allocated atomically.

**Best practices:**
- Always fetch latest state before updates: `trekker task show <id>`
- Use comments for coordination between instances
- Prefer additive operations (comments) over destructive ones (delete)
- If conflict detected, refresh and retry
