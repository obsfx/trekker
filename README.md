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

## Claude Code Plugin

<img src="https://omercan.io/trekker/images/claude-color.png" width="24" height="24" alt="Claude" style="vertical-align: middle;" />

Install the [trekker-claude-code](https://github.com/obsfx/trekker-claude-code) plugin for seamless integration with [Claude Code](https://claude.ai/code):

```bash
claude plugin marketplace add obsfx/trekker-claude-code
claude plugin install trekker
```

This gives Claude Code **13 slash commands**, **7 skills**, **4 lifecycle hooks**, and an **autonomous task agent**, all of which drive the `trekker` CLI directly. There is no MCP server to run or configure.

**Key features:**

- Persistent task memory across sessions via SQLite
- Search-first workflow to restore context
- 7 skills for guided workflows and best practices
- 4 lifecycle hooks for automatic state management
- Autonomous task agent for discovery and completion
- Steers the agent to Trekker instead of the built-in TaskCreate/TodoWrite
- Multi-instance safe with conflict handling

See the [plugin repository](https://github.com/obsfx/trekker-claude-code) for the full list of slash commands, hooks, skills, and agent details.

## Codex Plugin

<img width="36" height="36" alt="OpenAI-black-monoblossom" src="https://github.com/user-attachments/assets/e761c75d-6012-44b0-bfbe-c6cc235b54b4" />

Install the [trekker-codex](https://github.com/obsfx/trekker-codex) plugin for [Codex](https://developers.openai.com/codex):

```bash
codex plugin marketplace add obsfx/trekker-codex
codex plugin add trekker-codex@trekker
```

It adds **10 skills** for search, planning, starting, and completing tracked work, plus a **SessionStart hook** that surfaces in-progress or ready tasks. Like the Claude Code plugin, it runs the `trekker` CLI directly. Trust the hook with `/hooks` after installing so Codex runs it.

### Upgrading the plugins from 1.x

Both plugins dropped their bundled MCP servers in 2.0.0. Agents now call the `trekker` CLI, so make sure `trekker --version` works in the shell your agent uses. See each plugin's README for upgrade steps.

## Web Interface

<img src="https://omercan.io/trekker/images/dashboard-kanban.png" width="480" alt="trekker dashboard" style="vertical-align: middle;" />

For a visual kanban board, install the separate dashboard package:

```bash
npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000  # Start dashboard on port 3000
```

The dashboard shows tasks grouped by status and reads from the same `.trekker/trekker.db` database.
It also lets you update issue, epic, and comment prefixes from the UI. Those changes affect only newly created IDs.

You can find the detail in its [trekker-dashboard](https://github.com/obsfx/trekker-dashboard) repository.

## Why Trekker

AI coding agents work better when they can track their own progress. A simple CLI-based task manager keeps them on the right path across sessions.

I built this after using beads for a while. Beads does the job, but its codebase has grown quickly without enough care for what is happening inside. A task tracker is a simple application. It should not need thousands of lines of code.

My concerns about the future and security of that project led me here. Trekker is my simplified alternative.

What you get:

- Task and epic tracking with dependencies
- Ready command to find unblocked tasks and see what they unblock
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
# or set custom prefixes up front
trekker init --issue-prefix FEAT --epic-prefix PLAN --comment-prefix NOTE
```

Create an epic for your feature:

```bash
trekker epic create -t "User Authentication" -d "JWT-based auth with login and registration"
```

Add tasks to the epic:

```bash
trekker task create -t "Create user model" -e <epic-id>
trekker task create -t "Build login endpoint" -e <epic-id>
trekker task create -t "Build registration endpoint" -e <epic-id>
```

Set dependencies between tasks:

```bash
trekker dep add <task-id> <depends-on-id>
trekker dep add <task-id> <depends-on-id>
```

See what is ready to work on:

```bash
trekker ready
```

Update task status as you work:

```bash
trekker task update <task-id> -s in_progress
trekker task update <task-id> -s completed
```

## Commands

### Project

```bash
trekker init              # Initialize in current directory
trekker init --issue-prefix FEAT --epic-prefix PLAN --comment-prefix NOTE
trekker wipe              # Delete all data
trekker quickstart        # Show full documentation
```

### Project Config

```bash
trekker config list
trekker config get issue_prefix
trekker config set issue_prefix FEAT
trekker config set epic_prefix PLAN
trekker config set comment_prefix NOTE
trekker config unset issue_prefix
```

Supported keys:

- `issue_prefix` for tasks and subtasks
- `epic_prefix` for epics
- `comment_prefix` for comments

Use `issue_prefix` when you want task IDs to match your project naming scheme. For example, `trekker init --issue-prefix FEAT` starts new task and subtask IDs as `FEAT-1`, `FEAT-2`, and so on. You can also change it later with `trekker config set issue_prefix BUG`, which only affects newly created tasks and subtasks.

Prefix values are normalized to uppercase, must start with a letter, may contain numbers, and must be unique across the three families. Changing a prefix affects only newly created IDs. Existing IDs are never rewritten.

### Epics

```bash
trekker epic create -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker epic list [--status <status>] [--limit <n>] [--page <n>]
trekker epic show <epic-id>
trekker epic update <epic-id> [options]
trekker epic complete <epic-id>  # Complete epic and archive all tasks/subtasks
trekker epic delete <epic-id>
```

### Tasks

```bash
trekker task create -t <title> [-d <desc>] [-p <0-5>] [-s <status>] [--tags <tags>] [-e <epic-id>]
trekker task list [--status <status>] [--epic <epic-id>] [--limit <n>] [--page <n>]
trekker task show <task-id>
trekker task update <task-id> [options]
trekker task delete <task-id>
```

### Subtasks

```bash
trekker subtask create <parent-id> -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker subtask list <parent-id> [--limit <n>] [--page <n>]
trekker subtask update <subtask-id> [options]
trekker subtask delete <subtask-id>
```

### Comments

```bash
trekker comment add <task-id> -a <author> -c <content>
trekker comment list <task-id> [--limit <n>] [--page <n>]
trekker comment update <comment-id> -c <content>
trekker comment delete <comment-id>
```

### Dependencies

```bash
trekker dep add <task-id> <depends-on-id>
trekker dep remove <task-id> <depends-on-id>
trekker dep list <task-id>
```

### Ready

Show tasks that are ready to work on — unblocked and in `todo` status. For each ready task, shows downstream dependents that will be unblocked once it is completed:

```bash
trekker ready [--limit <n>] [--page <n>]
```

Example output:

```
2 ready task(s):

TREK-1 | P0 | Setup database
  -> unblocks TREK-2 | todo        | P1 | Build API layer
  -> unblocks TREK-3 | todo        | P1 | Build UI layer
TREK-4 | P2 | Write docs
```

Tasks are sorted by priority (critical first). A task is considered ready when:

- Status is `todo`
- It is a top-level task (not a subtask)
- All its dependencies are resolved (`completed`, `wont_fix`, or `archived`)

### Search

Full-text search across epics, tasks, subtasks, and comments using FTS5:

```bash
trekker search <query> [--type <types>] [--status <status>] [--limit <n>] [--page <n>]
```

Examples:

```bash
trekker search "authentication"                          # Search all entities
trekker search "bug fix" --type task,subtask             # Search only tasks and subtasks
trekker search "login" --type task --status completed    # Search completed tasks
```

`--status` takes a single status. Search is FTS5 full-text, not semantic: every word in a multi-word query must match, so one distinctive keyword usually finds more. To filter by several statuses at once, use `trekker list`.

### History

View audit log of all changes (creates, updates, deletes):

```bash
trekker history [--entity <id>] [--type <types>] [--action <actions>] [--since <date>] [--until <date>]
```

Examples:

```bash
trekker history                                  # All events
trekker history --entity <entity-id>             # Events for specific entity
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

## TOON Output

Add the `--toon` flag to any command for structured output in [TOON format](https://github.com/toon-format/toon). TOON is a token-efficient serialization format designed for AI agents, using fewer tokens than JSON while remaining machine-readable:

```bash
trekker --toon task list
trekker --toon task show <task-id>
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

## ID Prefixes

Default prefixes:

- Epics: `EPIC-1`, `EPIC-2`
- Tasks and subtasks: `TREK-1`, `TREK-2`
- Comments: `CMT-1`, `CMT-2`

These defaults are project-scoped and configurable through `trekker init --*-prefix` or `trekker config set`. Prefix changes affect only new entities and existing IDs keep their original values.

All list commands default to 50 items per page, sorted by newest first. Use `--limit` and `--page` to paginate through large result sets.

## Development

```bash
bun install                   # Install dependencies
bun run dev                   # Run CLI from source
bun run dev <command>         # Run a specific command
bun test                      # Run all tests
bun run lint                  # ESLint check
bun run format:check          # Prettier check
bun run check                 # Both lint and format
bun run typecheck             # TypeScript check for src, tests, and scripts
bun run test:container        # Release suite in Docker: packaging, upgrades, dashboard contract
bun run test:release          # check + typecheck + tests + container suite
```

## Releasing

```bash
bun run release <patch|minor|major> --dry-run   # Rehearse: everything except publish, commit, and tag
bun run release <patch|minor|major>             # Publish to npm
```

The release script:

1. Refuses to run with uncommitted changes, an existing tag for the new version, or without `npm login` (the dry run skips the git and login checks)
2. Installs dependencies with `--frozen-lockfile` and runs `bun run test:release`, which needs Docker for the container suite
3. Writes the new version to `package.json`, builds a clean `dist/`, and checks that the built CLI reports the new version and that the package contains `bin/` and `dist/`
4. Publishes `@obsfx/trekker` to npm, skipping the step if that version is already published
5. Commits `package.json` and creates the `vX.Y.Z` tag locally

A dry run or a failed step restores `package.json`. Push the release when it is done:

```bash
git push --atomic origin HEAD vX.Y.Z
```

The tag push runs the CI release suite again.

## Data Storage

Trekker creates a `.trekker` directory in your project root containing `trekker.db`. Add `.trekker` to your `.gitignore` if you do not want to track it in version control.

## For AI Agents

Run `trekker quickstart` to see the full guide with best practices for creating atomic tasks, writing good descriptions, and managing dependencies.

## How I Use It

This is my personal workflow for getting the most out of Trekker with AI agents:

- **Install the agent plugin.** I use [trekker-claude-code](https://github.com/obsfx/trekker-claude-code) with Claude Code and [trekker-codex](https://github.com/obsfx/trekker-codex) with Codex. Their skills and hooks teach the agent the search-first workflow and have it run the `trekker` CLI directly, so it uses exactly the commands documented here.

- **Always mention Trekker in prompts.** I include "use trekker" in my instructions so the agent knows to track its work.

- **Point agents to the quickstart.** I tell the agent it can run `trekker quickstart` to learn how to use Trekker properly. This gives it all the context it needs without me having to explain everything.

- **Use the dashboard for visibility.** I run [trekker-dashboard](https://github.com/obsfx/trekker-dashboard) to visually track what the agent is doing. It shows tasks on a kanban board and auto-refreshes, so I can monitor progress in real-time.

Example prompt snippet:

```
Use trekker to track your work. Run `trekker quickstart` if you need to learn how it works.
```

## License

MIT
