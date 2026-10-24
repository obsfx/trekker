---
name: trekker:create
description: Create a new task interactively
---

Create a new task in trekker.

**IMPORTANT**: `/trekker:create` is a skill (invoke via Skill tool), NOT a bash command. Use `trekker task create` CLI as shown below.

## MANDATORY: Search Before Creating

**You MUST search before creating ANY task.** This is non-negotiable.

```bash
# Search for existing/related issues FIRST
trekker search "<keywords from task title>"
trekker search "<related concepts>"
```

**If search finds related issues:**
- Consider updating the existing issue instead of creating a duplicate
- Add a comment to the existing issue if it needs more context
- Only create a new task if truly distinct from existing work

## Interactive Flow

1. **Search for existing issues** (MANDATORY - show results to user)
2. If no duplicates found, ask for the task title (required)
3. Ask for the task type context:
   - Is this part of an epic? If so, which one?
4. Ask for priority (0-5, default 2)
5. Ask for description (STRONGLY encouraged - tasks without context are useless)
6. Ask for tags (optional, comma-separated)

## Execution

```bash
trekker task create -t "<title>" [-d "<description>"] [-p <priority>] [-e <epic-id>] [--tags "<tags>"]
```

## After Creation

Show the created task details and ask if the user wants to:
- Start working on it immediately (set to in_progress)
- Link it to another task as a dependency
- Create a subtask
