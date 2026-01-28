# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trekker is a CLI-based issue tracker designed for AI coding agents. It stores tasks, epics, and dependencies in a local SQLite database per project. Requires Node.js 18+.

## Commands

```bash
pnpm install                  # Install dependencies
pnpm run dev                  # Run CLI directly from source
pnpm run dev <command>        # Run a specific command (e.g., pnpm run dev task list)
pnpm run build                # Build CLI to dist/
pnpm test                     # Run all tests
pnpm test tests/commands/task.test.ts          # Run single test file
pnpm run test:watch           # Run tests in watch mode
```

## Architecture

Three-layer architecture: `commands/` → `services/` → `db/`

- **commands/**: CLI handlers using Commander.js. Parse args, call services, format output via `utils/output.ts`
- **services/**: Business logic. Each entity (task, epic, dependency, etc.) has its own service file
- **db/**: Hybrid database layer
  - `client-node.ts`: Drizzle ORM over sql.js (WASM SQLite) for relational data
  - `vectors.ts`: SQLite-based vector storage for embeddings

### Database Architecture

Trekker uses sql.js (WASM-based SQLite) for all data storage:
- **Relational data**: Tasks, epics, comments via Drizzle ORM
- **Vector embeddings**: Stored in SQLite `embeddings` table for semantic search
- **Full-text search**: FTS5 index for keyword search

### Storage Layout

```
.trekker/
└── trekker.db      # SQLite: relational data, embeddings, FTS5 index
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

Trekker includes semantic search powered by Transformers.js:

- **Model**: `onnx-community/embeddinggemma-300m-ONNX` via @huggingface/transformers
- **Dimension**: 768 → 256 (truncated using Matryoshka Representation Learning)
- **Storage**: SQLite `embeddings` table with brute-force cosine similarity
- **Cache**: Model downloads to `~/.trekker/models/` on first use (~200MB)

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
| `src/db/vectors.ts` | SQLite vector storage and similarity search |
| `src/utils/async.ts` | Background task handling |

### Debug Mode

Set `TREKKER_DEBUG=1` to see background task errors (embedding failures).

## Testing

Tests use Vitest. Each test creates an isolated temp directory via `createTestContext()` helper.

- `ctx.run(args)` - Run CLI command, returns stdout
- `ctx.runToon(args)` - Run with `--toon`, returns parsed object
- `ctx.runExpectError(args)` - Run expecting failure, returns error message
