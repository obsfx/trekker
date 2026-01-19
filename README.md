# Trekker

A command line issue tracker built for AI coding agents.

Trekker stores tasks, epics, and dependencies in a local SQLite database. You run it from your project directory. No server required.

## Install

```bash
bun install -g trekker
```

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

```bash
trekker serve              # Start production server on port 3000
trekker serve -p 8080      # Start on custom port
trekker serve --dev        # Start development server
```

The web interface shows a kanban board with tasks grouped by status. It reads from the same database as the CLI and auto-refreshes every 5 seconds. The first run builds the webapp, subsequent runs start instantly.

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
