import { Command } from "commander";

const QUICKSTART_TEXT = `# Trekker - AI Agent Quickstart Guide

Trekker is a CLI-based issue tracker designed for coding agents. It stores all data in a local SQLite database at \`.trekker/trekker.db\` in your project root.

## Why Use Trekker?

As an AI agent, you should use Trekker to:
- **Track your work** across multiple sessions and context windows
- **Break down complex tasks** into manageable, atomic pieces
- **Document decisions** and progress for future reference
- **Manage dependencies** between tasks to ensure correct execution order
- **Offload context** - store your reasoning, findings, and state externally so you can recover after context resets
- **Persist memory** - comments survive context window limits and session boundaries

---

## Critical Rules for AI Agents

These rules are **non-negotiable**. Following them ensures continuity across sessions and prevents lost context.

### 1. ALWAYS Update Task Status

**Never leave a task in the wrong status.** Status reflects reality and helps you (and future sessions) understand what's happening.

- Set to \`in_progress\` **immediately** when you start working on a task
- Set to \`completed\` **only after** you've verified the work is done
- Set to \`wont_fix\` or \`archived\` if the task is no longer relevant
- **Before ending any session**: ensure all task statuses are accurate

\`\`\`bash
# Starting work
trekker task update TREK-1 -s in_progress

# Finishing work
trekker task update TREK-1 -s completed
\`\`\`

**Why this matters:** If you forget to update status, the next session (or another agent) won't know what's actually done. They'll either duplicate work or miss incomplete tasks.

### 2. ALWAYS Add a Summary Comment Before Moving On

**Before moving to a new task, document what you did on the current one.** This is your handoff to your future self.

Every task completion should include a comment with:
- **What was implemented** (files changed, functions added)
- **Key decisions made** and why
- **Any gotchas or important notes** for future reference
- **Testing done** or verification steps taken

\`\`\`bash
# Before marking complete, add a summary
trekker comment add TREK-1 -a "agent" -c "Completed: Implemented JWT auth endpoint.
- Added POST /api/auth/login in routes/auth.ts (lines 45-80)
- Created validateCredentials() in services/auth.ts
- Chose bcrypt for hashing (better library support than argon2)
- Tested: valid login returns token, invalid returns 401
- Note: Token expires in 24h, configurable via JWT_EXPIRY env var"

# Then mark complete
trekker task update TREK-1 -s completed
\`\`\`

**Why this matters:** Comments are your external memory. Without a summary, you lose all the context and reasoning from your work session.

### 3. Use Epic Descriptions for Implementation Plans

**Epic descriptions are your design documents.** Don't put brief one-liners—use them to capture the full implementation plan.

An epic description should include:
- **Goal and scope** - what problem are we solving?
- **Architecture overview** - how will components fit together?
- **Implementation phases** - what order should tasks follow?
- **Technical decisions** - chosen approaches and rationale
- **API contracts** - endpoints, request/response formats
- **Data models** - schema changes, new entities
- **Edge cases and constraints** - what to watch out for

\`\`\`bash
trekker epic create -t "User Authentication System" -d "## Goal
Implement secure user authentication with JWT tokens.

## Architecture
- Auth service handles token generation/validation
- Middleware intercepts requests and verifies tokens
- Redis stores refresh tokens for revocation support

## Implementation Phases
1. Basic JWT auth (login, token generation)
2. Refresh token mechanism
3. Password reset flow
4. Rate limiting on auth endpoints

## API Endpoints
- POST /api/auth/login - {email, password} -> {accessToken, refreshToken}
- POST /api/auth/refresh - {refreshToken} -> {accessToken}
- POST /api/auth/logout - invalidates refresh token
- POST /api/auth/forgot-password - sends reset email

## Data Model
- users table: id, email, passwordHash, createdAt, updatedAt
- refresh_tokens table: id, userId, token, expiresAt, revokedAt

## Security Considerations
- Passwords hashed with bcrypt (cost factor 12)
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Rate limit: 5 login attempts per minute per IP"
\`\`\`

**Why this matters:** When you start a new session, the epic description tells you the full plan. You won't have to re-derive the architecture or remember why certain decisions were made.

### 4. Archive Completed Work

**When a feature is fully done, move everything to \`archived\` status.** This keeps the active task list clean and signals that work is truly finished.

- Archive tasks after they've been completed and verified
- Archive the epic once all its tasks are done
- Archived items stay in the database for reference but don't clutter active views

\`\`\`bash
# After all tasks in an epic are completed
trekker task update TREK-1 -s archived
trekker task update TREK-2 -s archived
trekker task update TREK-3 -s archived
trekker epic update EPIC-1 -s archived
\`\`\`

**Why this matters:** A clean task list helps you focus on what's actually in progress. Archived items preserve history without noise.

---

## Best Practices for AI Agents

### Creating Epics
- Create one epic per **feature or major goal**
- Use clear, descriptive titles that explain the outcome (e.g., "User Authentication System" not "Auth")
- Write descriptions that capture the **why** and **scope** of the work
- Example: \`trekker epic create -t "REST API for User Management" -d "Build CRUD endpoints for users with JWT auth, input validation, and rate limiting"\`

### Creating Atomic Tasks
- Each task should be **completable in one focused session**
- Tasks should have a **single, clear objective**
- If a task feels too big, break it into subtasks
- Use action verbs: "Implement", "Add", "Fix", "Refactor", "Update"
- Bad: \`"Work on authentication"\`
- Good: \`"Implement JWT token generation endpoint"\`

### Writing Good Descriptions
- Explain **what** needs to be done and **how** to verify it's complete
- Include relevant technical details (endpoints, file paths, function names)
- Mention acceptance criteria when applicable
- Example: \`-d "Create POST /api/auth/login that accepts {email, password}, validates credentials against DB, returns JWT token. Should return 401 for invalid credentials."\`

### Using Tags Effectively
- Use tags to categorize work: \`--tags "api,auth,security"\`
- Common tag categories: component (\`api\`, \`ui\`, \`db\`), type (\`bug\`, \`feature\`, \`refactor\`), area (\`auth\`, \`payments\`)

### Managing Dependencies
- Always define dependencies when task order matters
- A task should not start until its dependencies are complete
- Use \`trekker dep list <task-id>\` to check what's blocking a task

### Adding Comments (Critical for Context Management)

Comments are your **external memory**. Use them extensively to:

**Save Your Thought Process:**
- Document your reasoning and analysis as you work
- Record hypotheses before investigating them
- Note alternatives you considered and why you chose/rejected them

**Offload Context:**
- When your context window is filling up, dump your current state into comments
- Record what you've tried, what worked, what didn't
- Save partial progress so you can resume after a context reset

**Preserve Investigation Results:**
- Store findings from code exploration
- Document file locations and relevant code snippets
- Record error messages and stack traces you're debugging

**Track Decision History:**
- Log architectural decisions with rationale
- Document trade-offs you evaluated
- Record blockers and how you resolved them

**Examples:**
\`\`\`bash
# Starting a task - record your initial analysis
trekker comment add TREK-1 -a "agent" -c "Initial analysis: Need to modify auth.ts (line 45-80) and add new endpoint in routes/api.ts. Dependencies: bcrypt, jsonwebtoken already installed."

# During investigation - save what you found
trekker comment add TREK-1 -a "agent" -c "Found existing validation in utils/validate.ts:23. Can reuse validateEmail() and validatePassword(). Token generation should follow pattern in auth/jwt.ts."

# Recording a decision
trekker comment add TREK-1 -a "agent" -c "Decision: Using bcrypt over argon2 for password hashing. Rationale: better library support, existing team familiarity, sufficient security for this use case."

# Saving progress before context reset
trekker comment add TREK-1 -a "agent" -c "Progress checkpoint: Implemented login endpoint (auth.ts:45-120). TODO: Add rate limiting, write tests. Blocked by: Need to clarify password reset flow with user."

# After hitting an issue
trekker comment add TREK-1 -a "agent" -c "Issue: JWT verification failing. Tried: 1) Checked secret key - correct, 2) Verified token format - valid, 3) Found issue - clock skew on server. Solution: Added 30s leeway to verification."
\`\`\`

---

## Initialization

Before using Trekker, initialize it in your project directory:

\`\`\`bash
trekker init              # Creates .trekker/ directory with database
\`\`\`

To remove all Trekker data:

\`\`\`bash
trekker wipe              # Prompts for confirmation
trekker wipe -y           # Skip confirmation
\`\`\`

## Global Options

| Option    | Description                                |
|-----------|--------------------------------------------|
| \`--json\`  | Output in JSON format (recommended for agents) |
| \`--help\`  | Show help for any command                  |

**Example:**
\`\`\`bash
trekker --json task list  # Returns tasks as JSON array
\`\`\`

---

## Epics

> High-level features or milestones

### Create Epic

\`\`\`bash
trekker epic create -t <title> [-d <description>] [-p <0-5>] [-s <status>]
\`\`\`

| Option | Required | Description |
|--------|----------|-------------|
| \`-t, --title\` | Yes | Epic title |
| \`-d, --description\` | No | Detailed description |
| \`-p, --priority\` | No | 0=critical, 1=high, 2=medium (default), 3=low, 4=backlog, 5=someday |
| \`-s, --status\` | No | todo (default), in_progress, completed, archived |

**Example:**
\`\`\`bash
trekker epic create -t "User Authentication" -d "Implement OAuth2 login" -p 1
\`\`\`

### List Epics

\`\`\`bash
trekker epic list [--status <status>]
\`\`\`

### Show Epic

\`\`\`bash
trekker epic show <epic-id>
\`\`\`

### Update Epic

\`\`\`bash
trekker epic update <epic-id> [-t <title>] [-d <desc>] [-p <priority>] [-s <status>]
\`\`\`

### Delete Epic

\`\`\`bash
trekker epic delete <epic-id>
\`\`\`

---

## Tasks

> Work items that can be assigned to epics

### Create Task

\`\`\`bash
trekker task create -t <title> [-d <description>] [-p <0-5>] [-s <status>] [--tags <tags>] [-e <epic-id>]
\`\`\`

| Option | Required | Description |
|--------|----------|-------------|
| \`-t, --title\` | Yes | Task title |
| \`-d, --description\` | No | Detailed description |
| \`-p, --priority\` | No | 0-5, default: 2 |
| \`-s, --status\` | No | todo (default), in_progress, completed, wont_fix, archived |
| \`--tags\` | No | Comma-separated tags, e.g., "api,auth,backend" |
| \`-e, --epic\` | No | Epic ID to assign task to |

**Example:**
\`\`\`bash
trekker task create -t "Implement login API" -d "POST /api/login endpoint" -e EPIC-1 --tags "api,auth"
\`\`\`

### List Tasks

\`\`\`bash
trekker task list [--status <status>] [--epic <epic-id>]
\`\`\`

**Examples:**
\`\`\`bash
trekker task list                      # All top-level tasks
trekker task list --status todo        # Filter by status
trekker task list --epic EPIC-1        # Filter by epic
\`\`\`

### Show Task

\`\`\`bash
trekker task show <task-id>
trekker --json task show TREK-1        # Get full task details as JSON
\`\`\`

### Update Task

\`\`\`bash
trekker task update <task-id> [-t <title>] [-d <desc>] [-p <priority>] [-s <status>] [--tags <tags>] [-e <epic-id>] [--no-epic]
\`\`\`

**Examples:**
\`\`\`bash
trekker task update TREK-1 -s in_progress
trekker task update TREK-1 --no-epic   # Remove from epic
\`\`\`

### Delete Task

\`\`\`bash
trekker task delete <task-id>
\`\`\`

---

## Subtasks

> Child tasks that belong to a parent task. They inherit the epic from their parent.

### Create Subtask

\`\`\`bash
trekker subtask create <parent-task-id> -t <title> [-d <description>] [-p <0-5>] [-s <status>]
\`\`\`

**Example:**
\`\`\`bash
trekker subtask create TREK-1 -t "Add input validation"
\`\`\`

### List Subtasks

\`\`\`bash
trekker subtask list <parent-task-id>
\`\`\`

### Update Subtask

\`\`\`bash
trekker subtask update <subtask-id> [-t <title>] [-d <desc>] [-p <priority>] [-s <status>]
\`\`\`

### Delete Subtask

\`\`\`bash
trekker subtask delete <subtask-id>
\`\`\`

---

## Comments

> Your external memory - use extensively to preserve context and reasoning

Comments are **critical for AI agents**. They persist beyond your context window and session boundaries. Use them to:
- Store your analysis and reasoning
- Save investigation results
- Record decisions with rationale
- Checkpoint progress before context resets
- Document blockers and solutions

### Add Comment

\`\`\`bash
trekker comment add <task-id> -a <author> -c <content>
\`\`\`

| Option | Required | Description |
|--------|----------|-------------|
| \`-a, --author\` | Yes | Comment author name (use "agent" for AI) |
| \`-c, --content\` | Yes | Comment text (can be multi-line) |

**Examples:**
\`\`\`bash
# Record analysis
trekker comment add TREK-1 -a "agent" -c "Analyzed codebase: auth logic in src/auth/, uses JWT stored in httpOnly cookies"

# Save progress checkpoint
trekker comment add TREK-1 -a "agent" -c "Checkpoint: Completed steps 1-3. Next: implement validation. Files modified: auth.ts, routes.ts"

# Document a blocker
trekker comment add TREK-1 -a "agent" -c "BLOCKED: Need clarification on password requirements. Asked user, waiting for response."
\`\`\`

### List Comments

\`\`\`bash
trekker comment list <task-id>
trekker --json comment list <task-id>    # Get as JSON for parsing
\`\`\`

**Pro tip:** Always read comments when resuming work on a task - they contain your previous context!

### Update Comment

\`\`\`bash
trekker comment update <comment-id> -c <new-content>
\`\`\`

### Delete Comment

\`\`\`bash
trekker comment delete <comment-id>
\`\`\`

---

## Dependencies

> Task relationships - which tasks must be completed before others can start.
> Trekker automatically detects and prevents circular dependencies.

### Add Dependency

\`\`\`bash
trekker dep add <task-id> <depends-on-id>
\`\`\`

This means:
- \`<task-id>\` depends on \`<depends-on-id>\`
- \`<task-id>\` cannot start until \`<depends-on-id>\` is done

**Example:**
\`\`\`bash
trekker dep add TREK-2 TREK-1    # TREK-2 depends on TREK-1
\`\`\`

### Remove Dependency

\`\`\`bash
trekker dep remove <task-id> <depends-on-id>
\`\`\`

### List Dependencies

\`\`\`bash
trekker dep list <task-id>
\`\`\`

Shows both:
- What this task depends on (blockers)
- What tasks this task blocks

---

## Web Interface

Trekker includes a web interface for visual task management.

### Start the Web Interface

\`\`\`bash
trekker serve              # Start on port 3000
trekker serve -p 8080      # Start on custom port
\`\`\`

The web interface provides:
- Kanban board with tasks grouped by status (TODO, In Progress, Completed)
- Epic filter to focus on specific features
- Task details including dependencies, subtasks, and tags
- Auto-refresh every 5 seconds to reflect CLI changes

---

## Reference

### ID Formats

| Type | Format | Example |
|------|--------|---------|
| Epic | \`EPIC-n\` | EPIC-1, EPIC-2 |
| Task/Subtask | \`TREK-n\` | TREK-1, TREK-42 |
| Comment | \`CMT-n\` | CMT-1, CMT-5 |

IDs are auto-generated and sequential within each type.

### Task Status Values

| Status | Description |
|--------|-------------|
| \`todo\` | Not started (default) |
| \`in_progress\` | Currently being worked on |
| \`completed\` | Finished successfully |
| \`wont_fix\` | Decided not to implement |
| \`archived\` | No longer relevant |

### Epic Status Values

| Status | Description |
|--------|-------------|
| \`todo\` | Not started (default) |
| \`in_progress\` | Work has begun |
| \`completed\` | All tasks done |
| \`archived\` | No longer relevant |

### Priority Scale

| Value | Meaning |
|-------|---------|
| 0 | Critical (drop everything) |
| 1 | High (do soon) |
| 2 | Medium (default) |
| 3 | Low (when time permits) |
| 4 | Backlog (future consideration) |
| 5 | Someday (nice to have) |

---

## Recommended Workflow for AI Agents

1. **Initialize** (once per project):
   \`\`\`bash
   trekker init
   \`\`\`

2. **Check existing state** (every session start):
   \`\`\`bash
   trekker --json task list --status in_progress   # See what's active
   trekker --json comment list TREK-1              # Read your previous context
   \`\`\`

3. **Create epic** for the feature you're working on:
   \`\`\`bash
   trekker epic create -t "Feature Name" -d "Description"
   \`\`\`

4. **Create tasks** for each piece of work:
   \`\`\`bash
   trekker task create -t "Task name" -e EPIC-1
   \`\`\`

5. **Add dependencies** if tasks have ordering requirements:
   \`\`\`bash
   trekker dep add TREK-2 TREK-1
   \`\`\`

6. **Document your initial analysis** before starting work:
   \`\`\`bash
   trekker comment add TREK-1 -a "agent" -c "Analysis: Need to modify X, Y, Z. Approach: ..."
   \`\`\`

7. **Update status** as you work:
   \`\`\`bash
   trekker task update TREK-1 -s in_progress
   \`\`\`

8. **Add comments frequently** - this is your external memory:
   \`\`\`bash
   # After investigating
   trekker comment add TREK-1 -a "agent" -c "Found: auth logic in src/auth.ts:45-80"

   # After making a decision
   trekker comment add TREK-1 -a "agent" -c "Decision: Using approach X because Y"

   # Before context might reset
   trekker comment add TREK-1 -a "agent" -c "Checkpoint: Completed A, B. Next: C, D"
   \`\`\`

9. **Mark complete** when done:
   \`\`\`bash
   trekker task update TREK-1 -s completed
   trekker comment add TREK-1 -a "agent" -c "Completed. Summary: Implemented X in files A, B, C."
   \`\`\`

10. **Use JSON output** for parsing:
    \`\`\`bash
    trekker --json task list
    trekker --json task show TREK-1
    \`\`\`

---

## Context Management Strategies

AI agents have limited context windows. Use Trekker to extend your effective memory:

### Starting a New Session

Always begin by reading your previous state:
\`\`\`bash
# What was I working on?
trekker --json task list --status in_progress

# What did I learn/decide?
trekker --json comment list TREK-1
\`\`\`

### During Long Tasks

Periodically checkpoint your progress:
\`\`\`bash
trekker comment add TREK-1 -a "agent" -c "Progress: Steps 1-3 done. Current state: X. Next: Y. Blockers: Z."
\`\`\`

### Before Context Window Fills Up

When you notice context getting large, dump your current mental state:
\`\`\`bash
trekker comment add TREK-1 -a "agent" -c "Context dump:
- Working on: implementing login validation
- Files involved: auth.ts (modified lines 45-80), routes.ts (new endpoint at line 120)
- Current approach: using existing validateEmail() from utils
- Remaining work: add rate limiting, write tests
- Open questions: unclear if we need refresh tokens"
\`\`\`

### After Solving a Problem

Document the solution so future-you doesn't repeat the investigation:
\`\`\`bash
trekker comment add TREK-1 -a "agent" -c "Solved: JWT verification failing. Root cause: clock skew. Fix: added 30s leeway in verify(). See auth.ts:67."
\`\`\`

### When Blocked

Record what you're waiting for:
\`\`\`bash
trekker comment add TREK-1 -a "agent" -c "BLOCKED: Need user input on password complexity requirements. Asked in conversation. Current assumption: min 8 chars, 1 number."
\`\`\`

---

## Common Scenarios

### Start a new feature

\`\`\`bash
trekker epic create -t "API Rate Limiting" -d "Implement rate limiting for all endpoints" -p 1
trekker task create -t "Design rate limit algorithm" -e EPIC-1
trekker task create -t "Implement Redis counter" -e EPIC-1
trekker task create -t "Add middleware" -e EPIC-1
trekker dep add TREK-3 TREK-2    # Middleware depends on Redis counter
trekker dep add TREK-2 TREK-1    # Redis counter depends on design
\`\`\`

### Check what's ready to work on

\`\`\`bash
trekker --json task list --status todo
\`\`\`

### Get all details about a task

\`\`\`bash
trekker --json task show TREK-1
\`\`\`

### Log progress

\`\`\`bash
trekker task update TREK-1 -s in_progress
trekker comment add TREK-1 -a "agent" -c "Chose token bucket algorithm"
trekker task update TREK-1 -s completed
\`\`\`

### Break down a complex task

\`\`\`bash
trekker subtask create TREK-2 -t "Set up Redis connection"
trekker subtask create TREK-2 -t "Implement increment logic"
trekker subtask create TREK-2 -t "Add TTL handling"
\`\`\`

### Resume work after context reset

\`\`\`bash
# 1. Find what you were working on
trekker --json task list --status in_progress

# 2. Read your previous comments to restore context
trekker --json comment list TREK-1

# 3. Read task details for full picture
trekker --json task show TREK-1

# 4. Continue work with restored context
\`\`\`

### Save context before stopping

\`\`\`bash
# Dump everything you know before session ends
trekker comment add TREK-1 -a "agent" -c "Session end checkpoint:
- Completed: login endpoint, validation
- In progress: rate limiting (50% done, see middleware.ts:30)
- Files modified: auth.ts, routes.ts, middleware.ts
- Next steps: finish rate limiter, add tests
- Notes: user prefers 100 req/min limit"
\`\`\`
`;

export const quickstartCommand = new Command("quickstart")
  .description("Show comprehensive guide for AI agents")
  .action(() => {
    console.log(QUICKSTART_TEXT);
  });
