import { Command } from "commander";

const QUICKSTART_TEXT = `# Trekker - AI Agent Quickstart Guide

Trekker is a CLI-based issue tracker designed for coding agents. It stores all data in a local SQLite database at \`.trekker/trekker.db\` in your project root.

## Why Use Trekker?

As an AI agent, you should use Trekker to:
- **Track your work** across multiple sessions and context windows
- **Break down complex tasks** into manageable, atomic pieces
- **Document decisions** and progress for future reference
- **Manage dependencies** between tasks to ensure correct execution order
- **Maintain context** that persists beyond your conversation memory

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

### Adding Comments
- Log important decisions and their rationale
- Document blockers or issues encountered
- Record solutions to problems for future reference
- Example: \`trekker comment add TREK-1 -a "agent" -c "Chose bcrypt over argon2 for password hashing due to better library support"\`

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

> Notes and updates on tasks

### Add Comment

\`\`\`bash
trekker comment add <task-id> -a <author> -c <content>
\`\`\`

| Option | Required | Description |
|--------|----------|-------------|
| \`-a, --author\` | Yes | Comment author name |
| \`-c, --content\` | Yes | Comment text |

**Example:**
\`\`\`bash
trekker comment add TREK-1 -a "agent" -c "Started implementation, found edge case in auth flow"
\`\`\`

### List Comments

\`\`\`bash
trekker comment list <task-id>
\`\`\`

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

2. **Create epic** for the feature you're working on:
   \`\`\`bash
   trekker epic create -t "Feature Name" -d "Description"
   \`\`\`

3. **Create tasks** for each piece of work:
   \`\`\`bash
   trekker task create -t "Task name" -e EPIC-1
   \`\`\`

4. **Add dependencies** if tasks have ordering requirements:
   \`\`\`bash
   trekker dep add TREK-2 TREK-1
   \`\`\`

5. **Update status** as you work:
   \`\`\`bash
   trekker task update TREK-1 -s in_progress
   \`\`\`

6. **Add comments** for progress notes or decisions:
   \`\`\`bash
   trekker comment add TREK-1 -a "agent" -c "Found issue with X, solving with Y"
   \`\`\`

7. **Mark complete** when done:
   \`\`\`bash
   trekker task update TREK-1 -s completed
   \`\`\`

8. **Use JSON output** for parsing:
   \`\`\`bash
   trekker --json task list
   trekker --json task show TREK-1
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
`;

export const quickstartCommand = new Command("quickstart")
  .description("Show comprehensive guide for AI agents")
  .action(() => {
    console.log(QUICKSTART_TEXT);
  });
