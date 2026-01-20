# Trekker

A CLI issue tracker built for AI coding agents. Stores tasks, epics, and dependencies in a local SQLite database with a built-in kanban board. No server required.

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
- Built-in kanban board UI with real-time updates
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
trekker task create -t "Create user model" -e EPIC-1
trekker task create -t "Build login endpoint" -e EPIC-1
trekker task create -t "Build registration endpoint" -e EPIC-1
```

Set dependencies between tasks:

```bash
trekker dep add TREK-2 TREK-1
trekker dep add TREK-3 TREK-1
```

Update task status as you work:

```bash
trekker task update TREK-1 -s in_progress
trekker task update TREK-1 -s completed
```

## Commands

### Project

```bash
trekker init              # Initialize in current directory
trekker wipe              # Delete all data
trekker quickstart        # Show full documentation
```

### Epics

```bash
trekker epic create -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker epic list [--status <status>]
trekker epic show <epic-id>
trekker epic update <epic-id> [options]
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

### Web Interface

For a visual kanban board, install the separate dashboard package:

```bash
npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000  # Start dashboard on port 3000
```

The dashboard shows tasks grouped by status and reads from the same `.trekker/trekker.db` database.

## JSON Output

Add the `--json` flag to any command for structured output:

```bash
trekker --json task list
trekker --json task show TREK-1
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

- Epics: `EPIC-1`, `EPIC-2`
- Tasks: `TREK-1`, `TREK-2`
- Comments: `CMT-1`, `CMT-2`

## Data Storage

Trekker creates a `.trekker` directory in your project root containing `trekker.db`. Add `.trekker` to your `.gitignore` if you do not want to track it in version control.

## For AI Agents

Run `trekker quickstart` to see the full guide with best practices for creating atomic tasks, writing good descriptions, and managing dependencies.

## License

MIT
