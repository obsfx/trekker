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
- **db/**: Hybrid database layer
  - `client.ts`: Drizzle ORM over `bun:sqlite` for relational data
  - `lance.ts`: LanceDB for vector embeddings (semantic search)

### Hybrid Database Architecture

Trekker uses a hybrid approach:
- **SQLite** (`bun:sqlite`): Tasks, epics, comments, FTS5 keyword search
- **LanceDB**: Vector embeddings for semantic similarity search

This provides ACID transactions for relational data while enabling fast vector similarity search without SQLite extension loading issues.

### Storage Layout

```
.trekker/
├── trekker.db      # SQLite: relational data, FTS5 index
└── vectors/        # LanceDB: embeddings for semantic search
```

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

## Semantic Search

Trekker includes semantic search powered by EmbeddingGemma (300M params, ONNX):

- **Model**: `onnx-community/embeddinggemma-300m-ONNX` (downloads ~200MB on first use)
- **Dimension**: 768 → truncated to 256 using Matryoshka Representation Learning
- **Storage**: LanceDB in `.trekker/vectors/`

### Key Commands

```bash
trekker semantic-search "query"     # Find semantically similar items
trekker similar TREK-1              # Find duplicates/related items
trekker search "query" --mode hybrid # Combine keyword + semantic
trekker reindex --embeddings        # Rebuild all embeddings
```

### Key Files for Semantic Search

| File | Purpose |
|------|---------|
| `src/services/embedding.ts` | Model loading, embedding generation |
| `src/services/semantic-search.ts` | Search logic, entity indexing |
| `src/db/lance.ts` | LanceDB vector operations |
| `src/utils/async.ts` | Background task handling |

### Debug Mode

Set `TREKKER_DEBUG=1` to see background task errors (embedding failures).

## Testing

Tests use Bun's test runner. Each test creates an isolated temp directory via `createTestContext()` helper.

- `ctx.run(args)` - Run CLI command, returns stdout
- `ctx.runToon(args)` - Run with `--toon`, returns parsed object
- `ctx.runExpectError(args)` - Run expecting failure, returns error message
