# Trekker for Codex

A Codex plugin that makes [Trekker](../../README.md) Codex's task tracker. Ten skills teach Codex a search-first workflow and have it run the `trekker` CLI directly, and a session-start hook puts current work in front of it, so tasks, decisions, and progress survive across sessions.

> This plugin used to live in [obsfx/trekker-codex](https://github.com/obsfx/trekker-codex). That repository is archived; this directory is its continuation, history included.

## Install

You need the `trekker` CLI on your PATH, which in turn needs [Bun](https://bun.sh):

```bash
npm install -g @obsfx/trekker
```

Then add the marketplace from the Trekker repository and install the plugin:

```bash
codex plugin marketplace add obsfx/trekker
codex plugin add trekker@trekker
```

Restart Codex, then trust the plugin's `SessionStart` hook with `/hooks`. Codex does not run plugin hooks until you trust them.

Initialize Trekker in a project when you want persistent tracking there:

```bash
cd your-project
trekker init
```

### Moving from obsfx/trekker-codex

Remove the old install, then add the new marketplace. If you installed from the repository marketplace, the old ids are `trekker-codex@trekker-codex-local`:

```bash
codex plugin remove trekker-codex@trekker-codex-local
codex plugin marketplace remove trekker-codex-local
codex plugin marketplace add obsfx/trekker
codex plugin add trekker@trekker
```

If you registered a clone by hand in `~/.agents/plugins/marketplace.json`, delete that entry. Versions before 2.0 bundled an MCP server; the plugin no longer has one, and its skills are now namespaced `trekker:` instead of `trekker-codex:`.

## What it adds

### Skills

| Skill | When Codex uses it |
|-------|--------------------|
| `trekker` | Core workflow: search first, one task in progress, summaries before completion |
| `search` | Recovering context with full-text search |
| `find-duplicates` | Checking for existing tasks before creating one |
| `issue-tracking` | Offering to track bugs, features, and backlog items the user mentions |
| `planning` | Breaking multi-step work into an epic, tasks, and dependencies before coding |
| `start-task` | Restoring a task's context and dependencies, then marking it in progress |
| `complete-task` | Leaving a summary comment, completing the task, and showing what is ready next |
| `smart-query` | Turning questions like "what is blocked?" into Trekker queries |
| `task-agent` | Working through ready tasks end to end |
| `task-sync` | Keeping Trekker as the source of truth while mirroring it in `update_plan` |

Codex picks a skill when your request matches its description. To choose one yourself, type `$` and pick it, or browse them with `/skills`.

### Session-start hook

On startup, resume, clear, and compaction the hook reports a missing `trekker` CLI or an uninitialized project, then shows in-progress tasks, or the ready queue when nothing is in progress, plus recent activity.

## How Codex talks to Trekker

There is no MCP server and nothing to configure. Every skill runs ordinary `trekker` commands in the shell: the same commands you would type, documented in the [main README](../../README.md). The skills point Codex at `trekker quickstart` and `trekker <command> --help` for exact flags, and at `--toon` for compact structured output.

## Layout

```text
plugins/codex/
├── plugin.json            # Portable manifest; Codex settings under extensions.com.openai
├── assets/trekker.svg
├── hooks/hooks.json       # SessionStart hook, discovered by default
├── scripts/session-start.sh
└── skills/                # 10 skills
```

The marketplace that lists this plugin is [`.agents/plugins/marketplace.json`](../../.agents/plugins/marketplace.json) at the repository root.

## Development

There is no build step: everything here is Markdown, JSON, and shell. To try a working copy, add your checkout as a local marketplace and reinstall after each change so Codex refreshes its cached copy:

```bash
codex plugin marketplace add /path/to/trekker
codex plugin add trekker@trekker
```

The plugin version follows the CLI version: `bun run release` bumps `plugin.json` together with `package.json`, so a released plugin always matches a released CLI.

## Updating

```bash
codex plugin marketplace upgrade trekker
```

Then restart Codex.
