---
name: planning
description: Use Trekker to plan and track multi-step tasks BEFORE starting implementation.
---

# Planning with Trekker

**Before starting any multi-step task, break it down in Trekker FIRST.**

This ensures:
- Work is tracked and resumable
- Dependencies are explicit
- Progress is visible across sessions
- Context survives resets

## When to Plan in Trekker

Use this workflow when:
- Task has 3+ steps
- Work spans multiple files
- Implementation requires specific order
- Task might take more than one session
- User asks for a feature/fix that isn't trivial

## Planning Workflow

### Step 1: Search for Related Work

```bash
# ALWAYS search first - previous work may exist trekker search "<what you're about to do>"
```

### Step 2: Create Epic (if substantial)

For features with multiple tasks:
```bash
trekker epic create -t "Feature: User Authentication" \
  -d "JWT-based auth with login, registration, and session management"
```

### Step 3: Break Down into Tasks

Create atomic, completable tasks:
```bash
# Each task should be independently completable
trekker task create -t "Create User model with email/password" \
  -d "Define User schema with bcrypt password hashing" \
  -e EPIC-1 -p 1

trekker task create -t "Implement login endpoint" \
  -d "POST /api/auth/login - validate credentials, return JWT" \
  -e EPIC-1 -p 1

trekker task create -t "Implement registration endpoint" \
  -d "POST /api/auth/register - create user, hash password" \
  -e EPIC-1 -p 1
```

### Step 4: Set Dependencies

Make execution order explicit:
```bash
# Login depends on User model
trekker dep add TREK-2 TREK-1

# Registration depends on User model
trekker dep add TREK-3 TREK-1
```

### Step 5: Mirror to TodoWrite

After Trekker is set up, create matching todos:
```
TaskCreate for each Trekker task
Set blockedBy relationships matching Trekker deps
```

## Task Quality Rules

### Good Task Titles
```
BAD:  "Fix bug"
GOOD: "Fix null pointer in UserService.getById when user not found"

BAD:  "Add feature"
GOOD: "Add email validation to registration form"
```

### Good Descriptions
Every task MUST answer:
- **What**: Specific action to take
- **Why**: Problem being solved
- **Where**: Files/components involved

## Execution Order

1. Check dependencies: `trekker dep list TREK-n`
2. Verify blockers resolved
3. Start task: `trekker task update TREK-n -s in_progress`
4. Update TodoWrite status
5. Do the work
6. Add checkpoint comments during work
7. Complete with summary

## Before Context Reset

If context is about to reset:
```bash
trekker comment add TREK-n -a "claude" -c "Checkpoint:
Done: [what's complete]
Next: [what's remaining]
Files: [modified files]
State: [any important context]"
```

## Example: Planning a Feature

User: "Add user authentication to the API"

```bash
# 1. Search first trekker search "authentication"
trekker search "login"

# 2. Create epic
trekker epic create -t "User Authentication System" \
  -d "JWT-based auth with login, registration, password reset"

# 3. Create tasks
trekker task create -t "Design auth database schema" \
  -d "Users table, refresh tokens, password reset tokens" -e EPIC-1 -p 0

trekker task create -t "Implement User model" \
  -d "Drizzle schema with bcrypt password hashing" -e EPIC-1 -p 1

trekker task create -t "Create auth middleware" \
  -d "JWT verification middleware for protected routes" -e EPIC-1 -p 1

trekker task create -t "Implement login endpoint" \
  -d "POST /auth/login - credential validation, JWT generation" -e EPIC-1 -p 1

trekker task create -t "Implement registration endpoint" \
  -d "POST /auth/register - user creation with validation" -e EPIC-1 -p 1

trekker task create -t "Add auth tests" \
  -d "Unit tests for auth service, integration tests for endpoints" -e EPIC-1 -p 2

# 4. Set dependencies
trekker dep add TREK-2 TREK-1   # Model depends on schema
trekker dep add TREK-3 TREK-2   # Middleware depends on model
trekker dep add TREK-4 TREK-2   # Login depends on model
trekker dep add TREK-5 TREK-2   # Register depends on model
trekker dep add TREK-6 TREK-4   # Tests depend on login
trekker dep add TREK-6 TREK-5   # Tests depend on register

# 5. Mirror to TodoWrite with same structure
```

## Key Principle

> Plan in Trekker FIRST, then execute. Never start coding multi-step work without a Trekker plan.
