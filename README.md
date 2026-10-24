# Trekker Claude Code Plugin

A Claude Code plugin for [trekker](https://github.com/obsfx/trekker), the AI-optimized issue tracker. Provides slash commands, an agent, skills, and hooks that teach Claude to drive the `trekker` CLI directly for seamless task management in Claude Code.

## Prerequisites

- [trekker](https://github.com/obsfx/trekker) CLI installed globally (`trekker --version` should work)
- [Bun](https://bun.sh), the runtime trekker uses
- Claude Code CLI

## Installation

### Step 1: Install Trekker CLI

```bash
npm install -g @obsfx/trekker
```

### Step 2: Install the Plugin

#### Option A: Via Plugin Marketplace (Recommended)

```bash
# Add the trekker marketplace
claude plugin marketplace add obsfx/trekker-claude-code

# Install the plugin
claude plugin install trekker
```

Or in Claude Code interactive mode:

```
/plugin marketplace add obsfx/trekker-claude-code
/plugin install trekker
```

There is nothing else to configure: the plugin calls the `trekker` CLI on your PATH.

#### Option B: Manual Installation

```bash
# Clone the repository
git clone https://github.com/obsfx/trekker-claude-code.git

# Symlink to Claude plugins directory
ln -s $(pwd)/trekker-claude-code ~/.claude/plugins/trekker
```

### Step 3: Initialize Trekker in Your Project

```bash
cd your-project
trekker init
```

## Features

### CLI-First

The plugin has no MCP server. Skills, commands, the agent, and hooks all run the `trekker` CLI through Bash, so the commands Claude runs are the same ones you would type, and every CLI feature is available the day it ships.

- `trekker --toon <command>` returns compact structured output for the agent
- `trekker quickstart` and `trekker <command> --help` are the reference the skills point to

#### Upgrading from 1.x

Version 2.0.0 removed the bundled MCP server and its `trekker_*` tools. After updating, you can delete any `mcp__plugin_trekker_trekker__*` entries from your Claude Code permission allowlists. To skip permission prompts for the CLI instead, allow `Bash(trekker:*)`.

### Slash Commands (13 commands)

| Command | Description |
|---------|-------------|
| `/trekker:prime` | Load workflow context |
| `/trekker:create` | Interactive task creation |
| `/trekker:list` | List tasks with filters |
| `/trekker:show` | Show task details |
| `/trekker:ready` | Find unblocked work |
| `/trekker:start` | Begin working on a task |
| `/trekker:done` | Complete task with summary |
| `/trekker:blocked` | Mark task as blocked |
| `/trekker:epic` | Manage epics |
| `/trekker:comment` | Add comment to task |
| `/trekker:deps` | Manage dependencies |
| `/trekker:history` | View audit trail of changes |
| `/trekker:task-agent` | Run autonomous task agent |

### Task Agent

The task agent (`/trekker:task-agent`) provides autonomous task completion:

1. **Discovery** - Find ready tasks
2. **Engagement** - Select and start a task
3. **Execution** - Complete the work
4. **Documentation** - Track progress and discoveries
5. **Closure** - Add summary and mark complete
6. **Iteration** - Move to next task

Invoke with `/trekker:task-agent` to let Claude work through tasks autonomously.

### Skills (7 skills)

| Skill | Description |
|-------|-------------|
| `trekker` | Core workflow guide for task management |
| `planning` | Plan and track multi-step tasks before implementation |
| `task-sync` | Synchronize Trekker with Claude's built-in TodoWrite |
| `issue-tracking` | Suggest Trekker when user mentions issues, bugs, or tasks |
| `search` | Search-first workflow for finding existing tasks |
| `find-duplicates` | Detect duplicate tasks before creating new ones |
| `smart-query` | Intelligent task querying |

### Hooks (4 hooks)

The plugin includes hooks for context management and workflow automation:

**SessionStart** - When Claude Code starts:
- Reports when the `trekker` CLI is missing from PATH
- Shows in-progress tasks with recent comments (resume context)
- If no work in progress, shows ready tasks
- Provides workflow reminder

**PreCompact** - Before context compaction:
- Reminds to save checkpoint comments
- Lists all in-progress tasks with details
- Shows recent comments for context preservation
- Provides checkpoint comment template

**Stop / SubagentStop** - When a task completes:
- Scans the assistant's final message for completed task references
- Automatically marks matching tasks as completed in Trekker
- Shows next ready task to continue the workflow

## Usage

### Basic Workflow

```bash
# Create a task
trekker task create -t "Implement feature X" -p 1

# Start working
trekker task update TREK-1 -s in_progress

# Add progress notes
trekker comment add TREK-1 -a "claude" -c "Progress: completed step 1"

# Complete with summary
trekker comment add TREK-1 -a "claude" -c "Summary: implemented X in files A, B"
trekker task update TREK-1 -s completed
```

### Using Slash Commands

In Claude Code:

```
/trekker:ready          # Find tasks to work on
/trekker:start TREK-1   # Start a task
/trekker:done TREK-1    # Complete with summary
/trekker:history        # View recent changes
```

### Context Preservation

Before ending a session or when prompted by PreCompact hook:

```bash
trekker comment add TREK-1 -a "claude" -c "Checkpoint: done X. Next: Y. Files: a.ts, b.ts"
```

## Project Structure

```
trekker-claude-code/
├── .claude-plugin/
│   ├── plugin.json           # Plugin metadata
│   └── marketplace.json      # Marketplace distribution config
├── .githooks/
│   └── post-commit           # Bumps the plugin version on every commit
├── commands/                 # Slash command definitions (13 commands)
├── agents/
│   └── task-agent.md         # Autonomous task completion agent
├── skills/                   # 7 skills for workflow automation
│   ├── trekker/              # Core workflow skill
│   ├── planning/             # Multi-step task planning
│   ├── task-sync/            # TodoWrite synchronization
│   ├── issue-tracking/       # Issue tracking suggestions
│   ├── search/               # Search-first workflow
│   ├── find-duplicates/      # Duplicate detection
│   └── smart-query/          # Intelligent querying
└── hooks/
    ├── hooks.json            # Hook configuration
    ├── lib/utils.sh          # Shared hook helpers
    ├── session-start.sh      # SessionStart hook
    ├── pre-compact.sh        # PreCompact hook
    └── task-completed.sh     # Stop/SubagentStop hook
```

## Development

There is no build step. Skills, commands, and hooks are plain Markdown and shell.

```bash
git clone https://github.com/obsfx/trekker-claude-code.git
cd trekker-claude-code

# Enable the version-bump hook so Claude Code picks up each change
git config core.hooksPath .githooks

# Load the working copy in Claude Code
claude --plugin-dir .
```

## Troubleshooting

### Plugin not loading

1. Verify trekker CLI is installed: `trekker --version`
2. Check plugin is in correct location: `ls ~/.claude/plugins/trekker`

### Trekker commands fail

1. Confirm the CLI resolves in the same shell Claude uses: `command -v trekker`
2. Confirm Bun is installed: `bun --version`
3. Check the flags for the failing command: `trekker <command> --help`

### Hooks not running

1. Ensure hook scripts are executable: `chmod +x hooks/*.sh`
2. Verify trekker is initialized in project: `ls .trekker`

## License

MIT
