# Trekker

A CLI issue tracker built for AI coding agents. Stores tasks, epics, and dependencies in a local SQLite database. No server required.

## Prerequisites

Trekker requires [Bun](https://bun.sh) runtime. It uses `bun:sqlite` for database operations. This is a deliberate choice: `bun:sqlite` is significantly faster than Node.js SQLite drivers, making CLI operations feel instant.

**Install Bun:**

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Or via npm
npm install -g bun
```

## Install

```bash
bun install -g @obsfx/trekker
```

Or with npm:

```bash
npm install -g @obsfx/trekker
```

## Why Trekker

AI coding agents work better when they can track their own progress. A simple CLI-based task manager keeps them on the right path across sessions.

I built this after using beads for a while. Beads does the job, but its codebase has grown quickly without enough care for what is happening inside. A task tracker is a simple application. It should not need thousands of lines of code.

My concerns about the future and security of that project led me here. Trekker is my simplified alternative.

What you get:
- Task and epic tracking with dependencies
- Full-text search across tasks, epics, subtasks, and comments
- Unified list view with filtering by type, status, priority, and custom sorting
- Optional kanban board UI available as a [separate package](https://github.com/obsfx/trekker-dashboard)
- No special directory required. The .trekker folder stays local to your project.
- No hook integrations. Just task management.

I built this with AI assistance, but I did it for myself. That means I put enough care into it to make it reliable for my own work.

## Quick Start

Initialize Trekker in your project:

```bash
trekker init
```

Create an epic for your feature:

```bash
trekker epic create -t "User Authentication" -d "JWT-based auth with login and registration"
```

Add tasks to the epic:

```bash
trekker task create -t "Create user model" -e TREKKER-EPIC-1
trekker task create -t "Build login endpoint" -e TREKKER-EPIC-1
trekker task create -t "Build registration endpoint" -e TREKKER-EPIC-1
```

Set dependencies between tasks:

```bash
trekker dep add TREKKER-TREK-2 TREKKER-TREK-1
trekker dep add TREKKER-TREK-3 TREKKER-TREK-1
```

Update task status as you work:

```bash
trekker task update TREKKER-TREK-1 -s in_progress
trekker task update TREKKER-TREK-1 -s completed
```

## Commands

### Project

```bash
trekker init              # Initialize default DB (trekker)
trekker init db:agent2    # Initialize a named DB
trekker wipe              # Delete all data (all DBs)
trekker wipe db:agent2    # Delete only agent2 DB
trekker quickstart        # Show full documentation
```

### Epics

```bash
trekker epic create -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker epic list [--status <status>]
trekker epic show <epic-id>
trekker epic update <epic-id> [options]
trekker epic complete <epic-id>  # Complete epic and archive all tasks/subtasks
trekker epic delete <epic-id>
```

### Tasks

```bash
trekker task create -t <title> [-d <desc>] [-p <0-5>] [-s <status>] [--tags <tags>] [-e <epic-id>]
trekker task list [--status <status>] [--epic <epic-id>]
trekker task show <task-id>
trekker task update <task-id> [options]
trekker task delete <task-id>
```

### Subtasks

```bash
trekker subtask create <parent-id> -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker subtask list <parent-id>
trekker subtask update <subtask-id> [options]
trekker subtask delete <subtask-id>
```

### Comments

```bash
trekker comment add <task-id> -a <author> -c <content>
trekker comment list <task-id>
trekker comment update <comment-id> -c <content>
trekker comment delete <comment-id>
```

### Dependencies

```bash
trekker dep add <task-id> <depends-on-id>
trekker dep remove <task-id> <depends-on-id>
trekker dep list <task-id>
```

### Search

Full-text search across epics, tasks, subtasks, and comments using FTS5:

```bash
trekker search <query> [--type <types>] [--status <status>] [--limit <n>] [--page <n>]
```

Examples:
```bash
trekker search "authentication"                          # Search all entities
trekker search "bug fix" --type task,subtask             # Search only tasks and subtasks
trekker search "login" --type comment --status completed # Search comments in completed items
```

### History

View audit log of all changes (creates, updates, deletes):

```bash
trekker history [--entity <id>] [--type <types>] [--action <actions>] [--since <date>] [--until <date>]
```

Examples:
```bash
trekker history                                  # All events
trekker history --entity TREKKER-TREK-1          # Events for specific entity
trekker history --type task --action update      # Only task updates
trekker history --since 2025-01-01 --limit 20    # Events after date
```

### List

Unified view of all epics, tasks, and subtasks:

```bash
trekker list [--type <types>] [--status <statuses>] [--priority <levels>] [--sort <fields>]
```

Examples:
```bash
trekker list                                     # All items, newest first
trekker list --type task --status in_progress    # Active tasks only
trekker list --priority 0,1 --sort priority:asc  # Critical/high priority first
trekker list --sort title:asc,created:desc       # Sort by title, then by date
```

### Web Interface

For a visual kanban board, install the separate dashboard package:

```bash
npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000  # Start dashboard on port 3000
```

The dashboard shows tasks grouped by status and reads from the `.trekker/` database files.

## Claude Code Integration

For seamless integration with [Claude Code](https://claude.ai/code), install the Trekker plugin:

```bash
claude /plugin marketplace add obsfx/trekker-claude-code
claude /plugin install trekker
```

This gives Claude Code native access to Trekker commands through MCP. The agent can create tasks, update status, and manage dependencies without running CLI commands directly.

See [trekker-claude-code](https://github.com/obsfx/trekker-claude-code) for more details.

## TOON Output

Add the `--toon` flag to any command for structured output in [TOON format](https://github.com/toon-format/toon). TOON is a token-efficient serialization format designed for AI agents, using fewer tokens than JSON while remaining machine-readable:

```bash
trekker --toon task list
trekker --toon task show TREKKER-TREK-1
```

## Status Values

Tasks: `todo`, `in_progress`, `completed`, `wont_fix`, `archived`

Epics: `todo`, `in_progress`, `completed`, `archived`

## Priority Scale

- 0: Critical
- 1: High
- 2: Medium (default)
- 3: Low
- 4: Backlog
- 5: Someday

## ID Formats

IDs are prefixed with the database name (uppercase):

- Epics: `TREKKER-EPIC-1`, `AGENT2-EPIC-1`
- Tasks: `TREKKER-TREK-1`, `AGENT2-TREK-1`
- Comments: `TREKKER-CMT-1`, `AGENT2-CMT-1`

The DB name prefix ensures IDs are unique across databases. When you reference an ID, the correct database is resolved automatically from the prefix.

## Multi-Database

Multiple AI agents can each have their own database to avoid conflicts:

```bash
trekker init                    # Creates .trekker/trekker.db
trekker init db:agent2          # Creates .trekker/agent2.db

trekker task create -t "Task" db:agent2   # Creates AGENT2-TREK-1
trekker task show AGENT2-TREK-1           # Auto-resolves DB from ID
trekker task list                         # Lists from ALL databases
trekker task list db:agent2               # Lists from agent2 only
```

Use `db:<name>` or `--db <name>` to target a specific database. Default DB name is `trekker`.

## Data Storage

Trekker creates a `.trekker` directory in your project root containing database files (e.g. `trekker.db`, `agent2.db`). Add `.trekker` to your `.gitignore` if you do not want to track it in version control.

## For AI Agents

Run `trekker quickstart` to see the full guide with best practices for creating atomic tasks, writing good descriptions, and managing dependencies.

## How I Use It

This is my personal workflow for getting the most out of Trekker with AI agents:

- **Install the Claude Code plugin.** I use [trekker-claude-code](https://github.com/obsfx/trekker-claude-code) to give Claude Code direct access to Trekker through MCP. This way, the agent manages tasks natively without running CLI commands.

- **Always mention Trekker in prompts.** I include "use trekker" in my instructions so the agent knows to track its work.

- **Point agents to the quickstart.** I tell the agent it can run `trekker quickstart` to learn how to use Trekker properly. This gives it all the context it needs without me having to explain everything.

- **Use the dashboard for visibility.** I run [trekker-dashboard](https://github.com/obsfx/trekker-dashboard) to visually track what the agent is doing. It shows tasks on a kanban board and auto-refreshes, so I can monitor progress in real-time.

Example prompt snippet:
```
Use trekker to track your work. Run `trekker quickstart` if you need to learn how it works.
```

## License

MIT
