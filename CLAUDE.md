# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trekker is a CLI-based issue tracker designed for AI coding agents. It stores tasks, epics, and dependencies in a local SQLite database per project.

## Project Structure

```
trekker/
├── src/
│   ├── index.ts              # Entry point, registers all commands
│   ├── commands/             # Command handlers (init, task, epic, etc.)
│   ├── services/             # Business logic (task.ts, epic.ts, dependency.ts)
│   ├── db/
│   │   ├── client.ts         # SQLite connection via bun:sqlite + Drizzle
│   │   └── schema.ts         # Drizzle table definitions and relations
│   ├── types/index.ts        # TypeScript types, status constants, interfaces
│   └── utils/
│       ├── output.ts         # JSON/text output formatting
│       ├── id-generator.ts   # TREK-n, EPIC-n ID generation
│       └── validator.ts      # Input validation
├── bin/
│   └── trekker.js            # CLI entry point
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## Commands

```bash
bun install                   # Install dependencies
bun run dev                   # Run CLI directly from source
bun run dev <command>         # Run a specific command
bun run build                 # Build CLI to dist/
```

## Data Model

- **Project**: Single project per `.trekker/` directory
- **Epic**: Groups tasks (EPIC-n format)
- **Task**: Main work unit (TREK-n format), can have subtasks via `parentTaskId`
- **Comment**: Attached to tasks (CMT-n format)
- **Dependency**: Task-to-task dependencies (prevents circular)

## Key Patterns

- Database stored at `.trekker/trekker.db` in project root
- Uses `bun:sqlite` with Drizzle ORM
- `--json` flag available globally for structured output

## Status Values

- Tasks: `todo`, `in_progress`, `completed`, `wont_fix`, `archived`
- Epics: `todo`, `in_progress`, `completed`, `archived`

## Priority Scale

0 (Critical) to 5 (Someday), default is 2 (Medium)

## Dashboard

For a visual kanban board interface, install the separate `@obsfx/trekker-dashboard` package:

```bash
npm install -g @obsfx/trekker-dashboard
trekker-dashboard -p 3000    # Start dashboard on port 3000
```
