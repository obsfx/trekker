# Trekker Codex Plugin

Codex plugin for [Trekker](https://github.com/obsfx/trekker), the AI-oriented issue tracker built for coding agents.

Repository: [github.com/obsfx/trekker-codex](https://github.com/obsfx/trekker-codex)

The plugin teaches Codex to use Trekker as persistent task memory by running the `trekker` CLI directly:

- 10 Codex skills for search, planning, task flow, and issue tracking
- 1 `SessionStart` hook for context recovery

There is no MCP server. Every skill runs ordinary `trekker` commands in the shell, so Codex runs the same commands you would type, and new CLI features are usable as soon as you update the CLI.

## What This Plugin Does

Once installed, Codex can use Trekker as persistent task memory instead of relying on chat context alone.

The plugin provides:

- search-first workflow skills for starting, finishing, and querying tracked work
- a session-start hook that surfaces in-progress or ready work when a project already has `.trekker`

## What Changed From The Claude Plugin

This is not a literal one-to-one copy of the Claude Code plugin.

Kept:

- Trekker workflow guidance
- search-first task tracking model
- session context recovery on startup

Intentionally not ported:

- Claude slash commands
- Claude task-agent command wrappers
- TodoWrite-specific sync behavior
- Claude-only task-blocking hooks and auto-complete stop hooks

Those parts were replaced with Codex skills and a lighter hook setup that fits Codex better.

## Prerequisites

- [Bun](https://bun.sh) installed
- `trekker` CLI installed globally
- Codex with plugin support

Install Trekker globally with either:

```bash
bun install -g @obsfx/trekker
```

or:

```bash
npm install -g @obsfx/trekker
```

## Installation

This repository is both the plugin and a Codex marketplace. `.agents/plugins/marketplace.json` defines the `trekker` marketplace with a single plugin, `trekker-codex`, rooted at the repository itself.

### Option A: Install From GitHub

```bash
codex plugin marketplace add obsfx/trekker-codex
codex plugin add trekker-codex@trekker
```

### Option B: Install From A Local Checkout

```bash
git clone git@github.com:obsfx/trekker-codex.git
codex plugin marketplace add ./trekker-codex
codex plugin add trekker-codex@trekker
```

After installing:

1. Restart Codex.
2. Review and trust the plugin's `SessionStart` hook with `/hooks`. Codex does not run plugin hooks until you trust them.
3. Open a project that already uses Trekker, or initialize Trekker in a test project with `trekker init`.

### Upgrading From 1.x

Version 2.0.0 removed the bundled MCP server and moved to the portable plugin layout. The marketplace is now named `trekker` instead of `trekker-codex-local`. Remove the old install and add it again:

```bash
codex plugin remove trekker-codex@trekker-codex-local
codex plugin marketplace remove trekker-codex-local
codex plugin marketplace add obsfx/trekker-codex
codex plugin add trekker-codex@trekker
```

If you registered the plugin by hand in `~/.agents/plugins/marketplace.json`, that entry keeps working after you pull the new version.

## Quick Verification

In a scratch project under `/tmp`:

```bash
mkdir -p /tmp/trekker-plugin-test
cd /tmp/trekker-plugin-test
trekker init
trekker task create -t "Verify Codex plugin installation" -d "Check that Codex can see and manage Trekker tasks" -p 1
```

Then ask Codex something like:

```text
Use Trekker to search current work, show me ready tasks, and summarize what is in progress.
```

Expected behavior:

- the session-start hook shows Trekker context when Codex opens the workspace
- Codex runs `trekker` commands in the shell to read and update tasks
- Trekker workflow skills are available for search, planning, starting, and completing work

## Usage Notes

The plugin assumes Trekker is the persistent source of truth.

Recommended workflow:

1. Search before any task action.
2. Read task details, comments, history, and dependencies before changing state.
3. Mark a task `in_progress` before working on it.
4. Leave `Checkpoint:` comments when pausing.
5. Leave a `Summary:` comment before marking work `completed`.

If the current workspace does not have `.trekker`, ask before running `trekker init`.

## Skills Included

- `trekker`
- `planning`
- `task-sync`
- `issue-tracking`
- `search`
- `find-duplicates`
- `smart-query`
- `start-task`
- `complete-task`
- `task-agent`

## Project Structure

```text
trekker-codex/
├── plugin.json                  # Portable manifest; Codex settings under extensions.com.openai
├── .agents/
│   └── plugins/
│       └── marketplace.json     # Repo marketplace pointing at ./
├── assets/
│   └── trekker.svg
├── hooks/
│   └── hooks.json               # SessionStart hook, discovered by default
├── scripts/
│   └── session-start.sh
└── skills/
    ├── complete-task/
    ├── find-duplicates/
    ├── issue-tracking/
    ├── planning/
    ├── search/
    ├── smart-query/
    ├── start-task/
    ├── task-agent/
    ├── task-sync/
    └── trekker/
```

## Updating The Plugin

If you installed from GitHub:

```bash
codex plugin marketplace upgrade trekker
```

If you installed from a local checkout, pull and reinstall so Codex refreshes its cached copy:

```bash
git -C trekker-codex pull
codex plugin add trekker-codex@trekker
```

Then restart Codex. There is no build step.
