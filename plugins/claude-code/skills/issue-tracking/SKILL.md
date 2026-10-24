---
name: issue-tracking
description: Use when user mentions issue, bug, task, ticket, feature, backlog, tracking, or work items. Suggests using Trekker for tracking.
---

# Issue Tracking with Trekker

When the user discusses issues, bugs, tasks, or features they want to track, suggest using Trekker.

## Learn More

**Run `trekker quickstart` for full command reference and workflow guide.**

---

## Trigger Keywords

This skill applies when conversation includes:
- `issue`, `bug`, `defect`, `problem`
- `task`, `ticket`, `work item`, `story`
- `feature`, `enhancement`, `improvement`
- `backlog`, `tracking`, `track this`
- `todo`, `to-do`, `action item`

## Behavior

### 1. Check Trekker Status

```bash
# Verify trekker is initialized
ls .trekker/trekker.db 2>/dev/null && echo "initialized" || echo "not initialized"
```

If not initialized, suggest:
```bash
trekker init
```

### 2. Ask Permission (Required)

Before creating or modifying any issue, **always ask**:

> "Would you like me to track this in Trekker? I can create a task with:
> - Title: [inferred title]
> - Priority: [suggested priority]
> - Description: [brief summary]"

Wait for explicit approval before proceeding.

### 3. Search Before Creating

Before creating a new issue, search for duplicates using **single keywords** (FTS5, not semantic):

```bash
# Use the most distinctive keyword from the issue
trekker search "<keyword>" --type task,subtask --limit 5
# Try a second keyword if first search has no results
trekker search "<related keyword>" --type task,subtask --limit 5
```

If similar issues exist, present them to the user:
> "Found existing tasks that might be related: [list]. Should I link to these instead of creating new?"

### 4. Create or Update

If approved and no duplicates:

```bash
trekker task create -t "<title>" -d "<description>" -p <priority>
```

If updating existing:
```bash
trekker comment add <task-id> -a "claude" -c "<update>"
```

## When to Suggest Trekker

**DO suggest** when user:
- Describes a bug or issue to fix
- Mentions a feature to implement
- Lists multiple things to do
- Asks to "remember" or "track" something
- Discusses work that spans multiple sessions

**DO NOT suggest** when:
- Task is trivial and completable in seconds
- User explicitly declines tracking
- It's a one-off question or clarification
- User is just exploring/brainstorming (not committing to work)

## Priority Mapping

| User Language | Suggested Priority |
|---------------|-------------------|
| "critical", "urgent", "ASAP", "blocker" | 0 (Critical) |
| "important", "high priority", "soon" | 1 (High) |
| "normal", no qualifier | 2 (Medium) |
| "when you have time", "low priority" | 3 (Low) |
| "eventually", "backlog" | 4 (Backlog) |
| "nice to have", "someday" | 5 (Someday) |

## Example Interaction

**User**: "There's a bug where the login fails with special characters"

**Claude**: "Would you like me to track this in Trekker? I can create:
- Title: Fix login failure with special characters in password
- Priority: 1 (High) - since it affects user login
- Description: Login fails when password contains special characters

Should I create this task?"

**User**: "Yes"

**Claude**:
```bash
trekker task create -t "Fix login failure with special characters in password" -d "Login fails when password contains special characters. Need to investigate encoding/escaping." -p 1
```
