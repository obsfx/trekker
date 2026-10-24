# Trekker Claude Code Plugin Design

**Date**: 2026-01-20
**Status**: Approved

## Overview

A Claude Code plugin + MCP server for the trekker issue tracker, providing full beads-like functionality for AI coding agents.

## Decisions

- **Goal**: Full beads parity (commands, agents, skills, MCP server, hooks)
- **MCP Language**: TypeScript (matches trekker codebase)
- **Integration**: CLI wrapper (runs trekker commands, parses JSON)
- **Structure**: Monorepo with plugin and mcp-server together

## Repository Structure

```
trekker-claude-code/
├── package.json              # Monorepo root
├── .claude-plugin/
│   └── plugin.json           # Plugin metadata + hooks
├── mcp-server/
│   ├── package.json          # MCP server package
│   ├── src/
│   │   ├── index.ts          # Entry point, MCP server setup
│   │   ├── tools/            # MCP tool definitions
│   │   │   ├── task.ts       # task tools (create, list, show, update)
│   │   │   ├── epic.ts       # epic tools
│   │   │   ├── subtask.ts    # subtask tools
│   │   │   ├── comment.ts    # comment tools
│   │   │   ├── dependency.ts # dependency tools
│   │   │   └── system.ts     # init, quickstart, wipe
│   │   ├── cli-runner.ts     # Runs trekker CLI via execFile, parses JSON
│   │   └── types.ts          # TypeScript interfaces
│   └── tsconfig.json
├── commands/                 # Slash commands (markdown)
│   ├── prime.md              # Load workflow context
│   ├── create.md             # Interactive task creation
│   ├── list.md               # List tasks with filters
│   ├── show.md               # Show task details
│   ├── ready.md              # Find ready work
│   ├── start.md              # Begin working on task
│   ├── done.md               # Complete task with summary
│   ├── blocked.md            # Mark task as blocked
│   ├── epic.md               # Create/list epics
│   ├── comment.md            # Add comment to task
│   └── deps.md               # Manage dependencies
├── agents/
│   └── task-agent.md         # Autonomous task completion agent
└── skills/
    └── trekker/
        ├── SKILL.md          # Main skill definition
        ├── README.md         # Human docs
        └── CLAUDE.md         # Maintenance guide
```

## MCP Server Architecture

### CLI Runner

Uses execFile for safe command execution (no shell injection):

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function runTrekker(args: string[]): Promise<unknown> {
  const result = await execFileAsync('trekker', ['--json', ...args]);
  return JSON.parse(result.stdout);
}
```

### MCP Tools

| MCP Tool | Trekker Command | Description |
|----------|-----------------|-------------|
| `trekker_task_create` | `task create` | Create new task |
| `trekker_task_list` | `task list` | List tasks with filters |
| `trekker_task_show` | `task show` | Show task details |
| `trekker_task_update` | `task update` | Update task fields |
| `trekker_epic_create` | `epic create` | Create epic |
| `trekker_epic_list` | `epic list` | List epics |
| `trekker_epic_show` | `epic show` | Show epic details |
| `trekker_epic_update` | `epic update` | Update epic |
| `trekker_subtask_create` | `subtask create` | Create subtask |
| `trekker_subtask_list` | `subtask list` | List subtasks |
| `trekker_comment_add` | `comment add` | Add comment |
| `trekker_comment_list` | `comment list` | List comments |
| `trekker_dep_add` | `dep add` | Add dependency |
| `trekker_dep_remove` | `dep remove` | Remove dependency |
| `trekker_dep_list` | `dep list` | List dependencies |
| `trekker_init` | `init` | Initialize project |
| `trekker_quickstart` | `quickstart` | Get workflow guide |

## Plugin Configuration

```json
{
  "name": "trekker",
  "description": "AI-optimized issue tracker for coding workflows.",
  "version": "0.1.0",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "trekker --toon quickstart" }]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "trekker --toon quickstart" }]
      }
    ]
  }
}
```

## Task Agent

Autonomous agent workflow:

1. **Discovery**: `trekker --toon task list --status todo` - find unblocked tasks
2. **Engagement**: `trekker task show <id>` + set status to in_progress
3. **Execution**: Complete work according to task description
4. **Documentation**: Create new tasks for discovered work, link dependencies
5. **Closure**: Add summary comment, mark completed
6. **Iteration**: Return to Discovery

## Skill: Trekker vs TodoWrite

| Aspect | Trekker | TodoWrite |
|--------|---------|-----------|
| Scope | Multi-session | Single-session |
| Persistence | SQLite database | Conversation-scoped |
| Best for | Complex projects | Linear checklists |

**Rule**: "Will I need this context tomorrow?" → Use Trekker

## Implementation Phases

1. **Phase 1**: MCP server with core tools (task, epic, subtask, comment, dep)
2. **Phase 2**: Plugin configuration with hooks
3. **Phase 3**: Slash commands
4. **Phase 4**: Task agent
5. **Phase 5**: Skill documentation
