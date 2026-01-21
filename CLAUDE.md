# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trekker is a CLI-based issue tracker designed for AI coding agents. It stores tasks, epics, and dependencies in a local SQLite database per project. Requires Bun runtime for `bun:sqlite`.

## Commands

```bash
bun install                   # Install dependencies
bun run dev                   # Run CLI directly from source
bun run dev <command>         # Run a specific command (e.g., bun run dev task list)
bun run build                 # Build CLI to dist/
bun test                      # Run all tests
bun test tests/commands/task.test.ts           # Run single test file
bun test --watch              # Run tests in watch mode
```

## Architecture

Three-layer architecture: `commands/` → `services/` → `db/`

- **commands/**: CLI handlers using Commander.js. Parse args, call services, format output via `utils/output.ts`
- **services/**: Business logic. Each entity (task, epic, dependency, etc.) has its own service file
- **db/**: Drizzle ORM over `bun:sqlite`. Schema in `schema.ts`, connection in `client.ts`

The database includes FTS5 virtual tables for full-text search (created in `client.ts` during init).

## Data Model

- **Project**: Single project per `.trekker/` directory
- **Epic**: Groups tasks (EPIC-n format)
- **Task**: Main work unit (TREK-n format), subtasks use `parentTaskId`
- **Comment**: Attached to tasks (CMT-n format)
- **Dependency**: Task-to-task dependencies (prevents circular)
- **Event**: Audit log for history tracking

## Key Patterns

- Database stored at `.trekker/trekker.db` in project root
- `--toon` flag available globally for TOON-formatted output (token-efficient for AI agents)
- ID generation via `idCounters` table to maintain TREK-n, EPIC-n, CMT-n sequences
- History tracking: all create/update/delete operations log to `events` table

## Status Values

- Tasks: `todo`, `in_progress`, `completed`, `wont_fix`, `archived`
- Epics: `todo`, `in_progress`, `completed`, `archived`

## Priority Scale

0 (Critical) to 5 (Someday), default is 2 (Medium)

## Testing

Tests use Bun's test runner. Each test creates an isolated temp directory via `createTestContext()` helper.

- `ctx.run(args)` - Run CLI command, returns stdout
- `ctx.runToon(args)` - Run with `--toon`, returns parsed object
- `ctx.runExpectError(args)` - Run expecting failure, returns error message
