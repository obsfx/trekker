# Trekker for Claude Code

A Claude Code plugin that makes [Trekker](../../README.md) Claude's task tracker. Slash commands, skills, hooks, and an autonomous agent teach Claude a search-first workflow and have it run the `trekker` CLI directly, so tasks, decisions, and progress survive across sessions and context resets.

> This plugin used to live in [obsfx/trekker-claude-code](https://github.com/obsfx/trekker-claude-code). That repository is archived; this directory is its continuation, history included.

## Install

You need the `trekker` CLI on your PATH, which in turn needs [Bun](https://bun.sh):

```bash
npm install -g @obsfx/trekker
```

Then add the marketplace from the Trekker repository and install the plugin:

```bash
claude plugin marketplace add obsfx/trekker
claude plugin install trekker@trekker
```

Inside Claude Code the same thing is `/plugin marketplace add obsfx/trekker` followed by `/plugin install trekker@trekker`.

Finally, initialize Trekker in a project:

```bash
cd your-project
trekker init
```

To skip permission prompts for Trekker commands, allow `Bash(trekker:*)` in your Claude Code settings.

### Moving from obsfx/trekker-claude-code

The old marketplace keeps working, but it no longer receives updates. Switch to the new one:

```bash
claude plugin uninstall trekker@trekker-marketplace
claude plugin marketplace remove trekker-marketplace
claude plugin marketplace add obsfx/trekker
claude plugin install trekker@trekker
```

Versions before 2.0 bundled an MCP server with `trekker_*` tools. The plugin no longer has one, so you can delete any `mcp__plugin_trekker_trekker__*` entries from your permission allowlists.

## What it adds

### Slash commands

| Command | What it does |
|---------|--------------|
| `/trekker:prime` | Load the Trekker workflow into the session |
| `/trekker:create` | Create a task interactively, after a duplicate search |
| `/trekker:list` | List tasks with filters |
| `/trekker:show` | Show a task with its comments and dependencies |
| `/trekker:ready` | Find unblocked work |
| `/trekker:start` | Restore a task's context and mark it in progress |
| `/trekker:done` | Add a summary comment and complete a task |
| `/trekker:blocked` | Record a blocker on a task |
| `/trekker:epic` | Manage epics |
| `/trekker:comment` | Add a comment to a task |
| `/trekker:deps` | Manage dependencies |
| `/trekker:history` | Show the audit trail |
| `/trekker:task-agent` | Run the autonomous task agent |

### Skills

| Skill | When Claude uses it |
|-------|---------------------|
| `trekker` | Core workflow: search first, one task in progress, summaries before completion |
| `planning` | Breaking multi-step work into an epic, tasks, and dependencies before coding |
| `task-sync` | Keeping Trekker as the source of truth while mirroring it in TodoWrite |
| `issue-tracking` | Offering to track bugs, features, and backlog items the user mentions |
| `search` | Recovering context with full-text search |
| `find-duplicates` | Checking for existing tasks before creating one |
| `smart-query` | Turning questions like "what is blocked?" into Trekker queries |

### Task agent

`/trekker:task-agent` works through the backlog on its own: it recovers context, picks a ready task, marks it in progress, does the work, leaves progress and summary comments, completes the task, and moves to the next one.

### Hooks

| Event | Behavior |
|-------|----------|
| `SessionStart` | Reports a missing `trekker` CLI, then shows in-progress tasks with their latest comments and dependencies, or the ready queue when nothing is in progress, plus recent activity |
| `PreCompact` | Prints the same state before compaction so in-progress work and checkpoints survive it |
| `TaskCompleted` | When Claude marks one of its own tasks done and that task names a Trekker ID (`TREK-12: fix login`) that is still in progress, the hook blocks the completion and tells Claude to leave a summary comment and complete the Trekker task first. It never changes Trekker itself and ignores tasks that name no ID. Needs `jq` |

All hooks exit quietly in projects without a `.trekker` directory.

## How Claude talks to Trekker

There is no MCP server and nothing to configure. Every skill and command runs ordinary `trekker` commands through Bash: the same commands you would type, documented in the [main README](../../README.md). The skills point Claude at `trekker quickstart` and `trekker <command> --help` for exact flags, and at `--toon` for compact structured output.

## Layout

```text
plugins/claude-code/
├── .claude-plugin/plugin.json   # Plugin manifest
├── agents/task-agent.md         # Autonomous task agent
├── commands/                    # 13 slash commands
├── hooks/
│   ├── hooks.json
│   ├── lib/utils.sh
│   ├── session-start.sh
│   ├── pre-compact.sh
│   └── task-completed.sh
└── skills/                      # 7 skills
```

The marketplace that lists this plugin is [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) at the repository root.

## Development

There is no build step: everything here is Markdown, JSON, and shell. Load a working copy into a session with:

```bash
claude --plugin-dir plugins/claude-code
```

Check the manifests with `claude plugin validate .` from the repository root.

The plugin version follows the CLI version: `bun run release` bumps `plugin.json` and the marketplace entry together with `package.json`, so a released plugin always matches a released CLI.

## Troubleshooting

- **Trekker commands fail.** Run `command -v trekker` and `bun --version` in the shell Claude uses, then check the failing command's flags with `trekker <command> --help`.
- **No session context appears.** Make sure the project has a `.trekker` directory (`trekker init`).
- **The TaskCompleted hook never blocks.** It needs `jq` on PATH, and it only acts when the Claude task's subject or description contains a Trekker ID whose task is in progress.
