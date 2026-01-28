# Node.js Migration Design

**Date:** 2026-01-28
**Status:** Approved
**Goal:** Migrate from Bun to Node.js for stability and portability

## Problem Statement

Bun's SQLite implementation crashes after test completion due to a C++ exception in native cleanup code. This is a Bun runtime bug that cannot be fixed in userland. Additionally, Bun requires users to install a less common runtime.

**Requirements:**
- Stability first - no crashes, ever
- Portability first - works on any system without special runtime
- Zero native dependencies - single `.trekker/` directory, no external services
- Keep SQLite semantics - preserve Drizzle ORM, FTS5, existing queries

## Architecture

### Before (Bun)

```
Bun runtime -> bun:sqlite -> LanceDB (native) -> onnxruntime-node (native)
```

### After (Node.js)

```
+--------------------------------------------------+
|                   Node.js 18+                    |
+-------------------+------------------------------+
|  CLI Layer        |  Commander.js (unchanged)   |
+-------------------+------------------------------+
|  ORM              |  Drizzle (sql.js driver)    |
+-------------------+------------------------------+
|  Database         |  sql.js (SQLite via WASM)   |
+-------------------+------------------------------+
|  Vectors          |  SQLite table + JS cosine   |
+-------------------+------------------------------+
|  Embeddings       |  onnxruntime-web (WASM)     |
+-------------------+------------------------------+
|  Storage          |  .trekker/trekker.db        |
+--------------------------------------------------+
```

**Zero native dependencies. Everything runs in pure JavaScript/WASM.**

## Component Changes

### 1. Database Driver: bun:sqlite to sql.js

**sql.js** is SQLite compiled to WebAssembly. Same SQL, same FTS5, no native code.

**Key difference:** sql.js runs in-memory and requires explicit persistence.

```typescript
// New initialization (async, one-time WASM load)
import initSqlJs, { Database } from "sql.js";

let db: Database;

async function initDb(dbPath: string) {
  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
}

function saveDb(dbPath: string) {
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
}
```

**Persistence strategy:** Save after every write operation. For a CLI tool with infrequent writes, the ~1-5ms overhead per write is negligible and ensures no data loss.

### 2. Vector Storage: LanceDB to SQLite

Replace LanceDB (native bindings) with vectors stored directly in SQLite.

**New schema:**
```sql
CREATE TABLE embeddings (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  vector BLOB NOT NULL  -- Float32Array serialized
);

CREATE INDEX idx_embeddings_type ON embeddings(entity_type);
```

**Similarity search in JavaScript:**
```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchSimilar(query: Float32Array, limit: number) {
  const all = db.exec("SELECT entity_id, entity_type, vector FROM embeddings");

  return all
    .map(row => ({
      entityId: row.entity_id,
      entityType: row.entity_type,
      similarity: cosineSimilarity(query, deserialize(row.vector))
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

**Performance:** For Trekker's scale (hundreds of tasks), scanning all embeddings and computing cosine similarity in JS is ~1-10ms. Acceptable.

### 3. Embedding Model: onnxruntime-node to onnxruntime-web

Switch from native ONNX runtime to WASM-based runtime.

**Tradeoff:** ~2-3x slower embedding generation. Acceptable for background task that runs after entity creation.

### 4. Build and Test Tooling

| Tool | Before (Bun) | After (Node.js) |
|------|--------------|-----------------|
| Runtime | bun | node / tsx |
| Test runner | bun test | vitest |
| Bundler | bun build | tsup |
| Package manager | bun / npm | pnpm (or npm) |

**New package.json scripts:**
```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Test migration:** Minimal changes - just swap imports:
```typescript
// Before
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

// After
import { describe, it, expect, beforeEach, afterEach } from "vitest";
```

## Migration Steps

### Phase 1: Database Layer
1. Add sql.js and drizzle-orm/sql-js dependencies
2. Create new src/db/client-sqljs.ts with async init and save-after-write
3. Update Drizzle config for sql.js driver
4. Add embeddings table to SQLite schema
5. Migrate vector operations from LanceDB to SQLite

### Phase 2: Embedding Runtime
6. Switch to onnxruntime-web
7. Update transformer pipeline configuration
8. Test embedding generation with WASM runtime

### Phase 3: Build Tooling
9. Add tsup, tsx, vitest dependencies
10. Create tsup.config.ts
11. Create vitest.config.ts
12. Update all test imports

### Phase 4: Cleanup
13. Remove Bun-specific dependencies (@types/bun)
14. Remove LanceDB dependency
15. Remove bun:sqlite imports
16. Update package.json engines field
17. Update documentation

## What Stays The Same

- All CLI commands and behavior
- Drizzle ORM schema and query patterns
- FTS5 full-text search
- Semantic search functionality
- TOON output format
- .trekker/ directory structure

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| sql.js WASM load time | One-time ~50ms on first command, cached after |
| Embedding slower | Background task, does not block CLI response |
| Large WASM files | Tree-shake unused features, lazy load embeddings |
| Migration bugs | Comprehensive test coverage already exists |

## Success Criteria

- [ ] All existing tests pass with vitest
- [ ] No native dependencies in production bundle
- [ ] Works on macOS, Linux, Windows without special setup
- [ ] No crashes during test cleanup
- [ ] Semantic search performs within 100ms for 1000 entities
