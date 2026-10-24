---
name: planning
description: Plan multi-step work in Trekker before implementation. Use epics, tasks, and dependencies so work survives session resets.
---

# Planning with Trekker

Use this skill for work that spans multiple files, requires sequencing, or is likely to continue across sessions.

## Rules

1. Search first for related work before planning anything new.
2. Create an epic when the feature naturally breaks into multiple tasks.
3. Make tasks small enough to complete independently.
4. Encode execution order with dependencies instead of keeping it implicit.
5. Mirror the current session in `update_plan` only after Trekker is accurate.

## Workflow

```bash
trekker search "authentication"
trekker epic create -t "User Authentication" -d "JWT login, registration, and session handling"
trekker task create -t "Design auth schema" -d "Users, refresh tokens, and password reset entities" -e EPIC-1 -p 0
trekker task create -t "Implement login endpoint" -d "Credential validation and token issuance" -e EPIC-1 -p 1
trekker dep add TREK-2 TREK-1
```

Each task description should answer three things:

- What needs to change
- Why it matters
- Where the work will happen

## Execution Guidance

Before starting a planned task:

```bash
trekker dep list TREK-2
trekker task show TREK-2
trekker comment list TREK-2
trekker task update TREK-2 -s in_progress
```

If the user only wants brainstorming and not committed tracking yet, do not create Trekker items without approval.
