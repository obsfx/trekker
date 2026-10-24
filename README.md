# Trekker

Persistent task memory for AI coding agents.

Trekker is a command-line issue tracker that keeps epics, tasks, subtasks, dependencies, and comments in a SQLite database inside your project. Agents forget everything between sessions; Trekker gives them somewhere to write it down and a fast way to find it again. There is no server, no account, and no sync service: just a `.trekker` folder next to your code.

```text
$ trekker ready
1 ready task(s) (page 1, 50 per page)

TREK-1 | P1 | Create the users table (EPIC-1)
  -> unblocks TREK-2 | todo        | P1 | Build the login endpoint
  -> unblocks TREK-3 | todo        | P2 | Build the signup endpoint
```

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Use it with your agent](#use-it-with-your-agent)
- [How Trekker models work](#how-trekker-models-work)
- [Command reference](#command-reference)
- [Dashboard](#dashboard)
- [Data, concurrency, and history](#data-concurrency-and-history)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Releasing](#releasing)
- [Why Trekker](#why-trekker)

## Install

Trekker runs on [Bun](https://bun.sh). It uses `bun:sqlite`, which is fast enough that every command feels instant, so Bun has to be installed even if you install Trekker with npm.

```bash
# Install Bun (macOS and Linux; see bun.sh for Windows)
curl -fsSL https://bun.sh/install | bash

# Install Trekker
bun install -g @obsfx/trekker    # or: npm install -g @obsfx/trekker
```

Check it with `trekker --version`.

## Quick start

```bash
cd your-project
trekker init

trekker epic create -t "User authentication" -d "Email and password login with sessions"
trekker task create -t "Create the users table" -e EPIC-1 -p 1
trekker task create -t "Build the login endpoint" -e EPIC-1 -p 1
trekker task create -t "Build the signup endpoint" -e EPIC-1

trekker dep add TREK-2 TREK-1    # login depends on the users table
trekker dep add TREK-3 TREK-1    # so does signup

trekker ready                    # TREK-1 is the only unblocked task
trekker task update TREK-1 -s in_progress
trekker comment add TREK-1 -a "claude" -c "Checkpoint: schema in src/db/schema.ts, migration pending"
trekker comment add TREK-1 -a "claude" -c "Summary: added the users table and its migration"
trekker task update TREK-1 -s completed

trekker ready                    # TREK-2 and TREK-3 are unblocked now
```

The rhythm agents follow is the same: search for existing work, mark a task `in_progress`, leave checkpoint comments while working, write a summary comment, then complete it and ask `trekker ready` for the next one.

## Use it with your agent

### Claude Code

<img src="https://omercan.io/trekker/images/claude-color.png" width="24" height="24" alt="Claude" />

```bash
claude plugin marketplace add obsfx/trekker
claude plugin install trekker@trekker
```

The plugin adds 13 slash commands (`/trekker:ready`, `/trekker:start`, `/trekker:done`, ...), 7 skills, an autonomous task agent, and 4 hooks that load in-progress work at session start and preserve it before compaction. See [plugins/claude-code](plugins/claude-code/README.md).

### Codex

<img width="28" height="28" alt="OpenAI" src="https://github.com/user-attachments/assets/e761c75d-6012-44b0-bfbe-c6cc235b54b4" />

```bash
codex plugin marketplace add obsfx/trekker
codex plugin add trekker@trekker
```

The plugin adds 10 skills for searching, planning, starting, and completing tracked work, plus a session-start hook that surfaces current work. Trust the hook with `/hooks` after installing. See [plugins/codex](plugins/codex/README.md).

### How the plugins work

Both plugins are instructions, not integrations. Their skills, commands, and hooks teach the agent a search-first workflow and have it run the `trekker` CLI directly, so the agent uses exactly the commands documented below. There is no MCP server to run, and a new CLI feature is available to agents as soon as you update the CLI.

> The plugins used to live in [obsfx/trekker-claude-code](https://github.com/obsfx/trekker-claude-code) and [obsfx/trekker-codex](https://github.com/obsfx/trekker-codex). Both repositories are archived and their history now lives in [`plugins/`](plugins). If you installed from either one, each plugin's README has the commands to switch to the new marketplace.

### Any other agent

Trekker is a plain CLI, so any agent that can run shell commands can use it. Put this in your instructions:

```text
Use trekker to track your work. Run `trekker quickstart` to learn how it works.
```

`trekker quickstart` prints a complete guide written for agents: the workflow, the commands, and how to write tasks and comments that a future session can pick up.

## How Trekker models work

| Entity | Default ID | Notes |
|--------|------------|-------|
| Epic | `EPIC-1` | A feature or milestone that groups tasks |
| Task | `TREK-1` | The unit of work; can belong to an epic |
| Subtask | `TREK-2` | A child of a task; shares the task ID sequence |
| Comment | `CMT-1` | Progress notes, checkpoints, and summaries on a task |

**Statuses.** Tasks and subtasks: `todo`, `in_progress`, `completed`, `wont_fix`, `archived`. Epics: `todo`, `in_progress`, `completed`, `archived`.

**Priorities.** `0` critical, `1` high, `2` medium (the default), `3` low, `4` backlog, `5` someday.

**Dependencies.** `trekker dep add TREK-2 TREK-1` means TREK-2 depends on TREK-1. Cycles are rejected.

**Ready.** A task is ready when it is a top-level task in `todo` and every task it depends on is `completed`, `wont_fix`, or `archived`. `trekker ready` lists ready tasks by priority and shows what each one unblocks.

**ID prefixes.** The prefixes are per project. Set them at init or later; a change only affects IDs created afterwards, and existing IDs are never rewritten. Prefixes are uppercased, must start with a letter, and must differ from each other.

```bash
trekker init --issue-prefix FEAT --epic-prefix PLAN --comment-prefix NOTE
trekker config set issue_prefix BUG
```

## Command reference

Every command accepts `--toon` before the subcommand for structured output in [TOON](https://github.com/toon-format/toon), a JSON-compatible format that costs agents fewer tokens than JSON: `trekker --toon task show TREK-1`. List commands are paginated with `--limit` and `--page` and default to 50 items, newest first.

### Project

```bash
trekker init [--issue-prefix <p>] [--epic-prefix <p>] [--comment-prefix <p>]
trekker quickstart                      # Full guide for agents
trekker wipe [-y]                       # Delete all Trekker data in this project
trekker config list
trekker config get <key>                # issue_prefix, epic_prefix, comment_prefix
trekker config set <key> <value>
trekker config unset <key>
```

### Epics

```bash
trekker epic create -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker epic list [-s <status>]
trekker epic show <epic-id>
trekker epic update <epic-id> [-t <title>] [-d <desc>] [-p <0-5>] [-s <status>]
trekker epic complete <epic-id>         # Complete the epic and archive its tasks and subtasks
trekker epic delete <epic-id>
```

### Tasks and subtasks

```bash
trekker task create -t <title> [-d <desc>] [-p <0-5>] [-s <status>] [--tags <a,b>] [-e <epic-id>]
trekker task list [-s <status>] [-e <epic-id>]
trekker task show <task-id>
trekker task update <task-id> [-t <title>] [-d <desc>] [-p <0-5>] [-s <status>] [--tags <a,b>] [-e <epic-id> | --no-epic]
trekker task delete <task-id>

trekker subtask create <task-id> -t <title> [-d <desc>] [-p <0-5>] [-s <status>]
trekker subtask list <task-id>
trekker subtask update <subtask-id> [options]
trekker subtask delete <subtask-id>
```

### Comments and dependencies

```bash
trekker comment add <task-id> -a <author> -c <content>
trekker comment list <task-id>
trekker comment update <comment-id> -c <content>
trekker comment delete <comment-id>

trekker dep add <task-id> <depends-on-id>
trekker dep remove <task-id> <depends-on-id>
trekker dep list <task-id>              # What it depends on and what it blocks
```

### Finding work

```bash
trekker ready                           # Unblocked todo tasks and what they unblock
trekker search <query> [--type epic,task,subtask,comment] [--status <status>] [--rebuild-index]
trekker list [--type <types>] [--status <a,b>] [--priority <0,1>] [--since <date>] [--until <date>] [--sort <field:dir,...>]
trekker history [--entity <id>] [--type <types>] [--action create,update,delete] [--since <date>] [--until <date>]
```

Search is SQLite FTS5 full-text search, not semantic search. Every word in a query has to match, so one distinctive keyword usually finds more than a sentence: search `"auth"`, then `"login"`, rather than `"fix the login bug"`. Results show the matching text with the hit in `**bold**`. `--status` takes a single status; to filter by several, use `trekker list`, which takes comma-separated `--type`, `--status`, and `--priority` and sorts by `created`, `updated`, `title`, `priority`, or `status`:

```bash
trekker list --type task --status todo,in_progress --sort priority:asc
trekker list --priority 0,1 --since 2026-01-01
```

## Dashboard

<img src="https://omercan.io/trekker/images/dashboard-kanban.png" width="480" alt="Trekker dashboard" />

[trekker-dashboard](https://github.com/obsfx/trekker-dashboard) is a separate package with a kanban board that reads the same `.trekker/trekker.db` and refreshes as the agent works. It can also change the project's ID prefixes.

```bash
npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000
```

## Data, concurrency, and history

Everything lives in `.trekker/trekker.db` at the project root. Commit it if you want the backlog in version control, or add `.trekker` to `.gitignore` if you do not.

Several agents can work in the same project at once. Writes wait up to five seconds for a lock instead of failing, and IDs are allocated atomically, so parallel `task create` calls never collide.

Every create, update, and delete is recorded with the fields that changed. `trekker history` shows what changed and when, which is often the fastest way for a new session to understand what the last one did.

## Repository layout

```text
src/                         The CLI
tests/                       Bun tests; tests/container holds the Docker release suite
plugins/claude-code/         Claude Code plugin
plugins/codex/               Codex plugin
.claude-plugin/              Claude Code marketplace for this repository
.agents/plugins/             Codex marketplace for this repository
scripts/release.ts           Release script
```

## Development

```bash
bun install
bun run dev <command>         # Run the CLI from source, e.g. bun run dev task list
bun test                      # Unit and integration tests
bun run check                 # ESLint and Prettier
bun run typecheck             # TypeScript for src, tests, and scripts
bun run test:container        # Docker release suite: packaging, upgrades from published versions, dashboard contract
bun run test:release          # All of the above
```

The container suite needs Docker. It packs the CLI, installs it in a clean image next to the published dashboard and earlier Trekker releases, and checks that the package installs, upgrades keep data intact, and the dashboard can share a database with the CLI.

## Releasing

The CLI and both plugins share one version number.

```bash
bun run release <patch|minor|major> --dry-run   # Rehearse: everything except publish, commit, and tag
bun run release <patch|minor|major>             # Publish
git push --atomic origin HEAD vX.Y.Z
```

The release script:

1. Refuses to run with uncommitted changes, an existing tag for the new version, or no `npm login`. A dry run skips the git and login checks.
2. Installs dependencies with `--frozen-lockfile` and runs `bun run test:release`.
3. Writes the new version to `package.json`, both plugin manifests, and the Claude Code marketplace entry, after checking they all matched the old version.
4. Builds a clean `dist/`, checks that the built CLI reports the new version, and checks that the package contains `bin/` and `dist/`.
5. Publishes `@obsfx/trekker`, skipping that step if the version is already on npm.
6. Commits the version bump as `X.Y.Z` and creates the `vX.Y.Z` tag locally.

A dry run, or any failure after step 3, restores the version files. Pushing the tag runs the release suite again in CI.

## Why Trekker

AI coding agents work better when they track their own progress. A small CLI task manager keeps them on course across sessions, and it should not take thousands of lines of code to do that.

I built Trekker after using beads for a while. It did the job, but its codebase grew fast without much care for what was happening inside, and I had concerns about where the project was heading and about its security. Trekker is my simpler alternative: a local database, a CLI, and nothing else.

I built it with AI assistance, but I built it for my own daily work, so it gets the care that requires. My setup is simple: I install the agent plugin, tell the agent to use Trekker and to run `trekker quickstart` when it needs a refresher, and keep the dashboard open in a browser tab to watch the board move.

## License

MIT
