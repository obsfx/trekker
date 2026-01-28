# Semantic Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add semantic search to Trekker using EmbeddingGemma model for finding related tasks by meaning, not just keywords.

**Architecture:** EmbeddingGemma 300M via Transformers.js generates 256-dim vectors, stored in sqlite-vec, queried via cosine distance. Hybrid search combines FTS5 keyword scores with vector similarity.

**Tech Stack:** @huggingface/transformers, sqlite-vec, Bun runtime

---

## Task Dependency Graph

```
TREK-24 (sqlite-vec + embeddings table)
    │
    ├──► TREK-25 (EmbeddingService)
    │        │
    │        ├──► TREK-26 (semantic-search command)
    │        │        │
    │        │        ├──► TREK-27 (similar command)
    │        │        ├──► TREK-28 (--mode flag)
    │        │        ├──► TREK-31 (MCP tools)
    │        │        │        │
    │        │        │        └──► TREK-32 (skills)
    │        │        └──► TREK-33 (tests)
    │        │
    │        └──► TREK-29 (hook into services)
    │                 │
    │                 └──► TREK-30 (reindex command)
```

---

## Task 1: TREK-24 - Add sqlite-vec extension and embeddings table

**Files:**
- Modify: `package.json`
- Modify: `src/db/client.ts`

### Step 1: Add sqlite-vec dependency

```bash
bun add sqlite-vec
```

### Step 2: Update package.json to verify

Run: `cat package.json | grep sqlite-vec`
Expected: `"sqlite-vec": "^0.1.x"`

### Step 3: Create embeddings infrastructure in client.ts

Modify `src/db/client.ts` - add after existing imports:

```typescript
import * as sqliteVec from 'sqlite-vec';
```

### Step 4: Add vec extension loading in createDb function

Modify `src/db/client.ts` - add after `sqliteInstance = new Database(dbPath);`:

```typescript
// Load sqlite-vec extension
sqliteVec.load(sqliteInstance);
```

### Step 5: Create embeddings virtual table

Add new function in `src/db/client.ts`:

```typescript
function createEmbeddingsTable(sqlite: Database): void {
  // Vector storage using sqlite-vec
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
      entity_id TEXT PRIMARY KEY,
      entity_type TEXT,
      embedding FLOAT[256]
    )
  `);

  // Metadata for model versioning
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS embedding_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Initialize metadata
  sqlite.run(`
    INSERT OR IGNORE INTO embedding_meta (key, value)
    VALUES ('model_name', 'embeddinggemma-300m')
  `);
  sqlite.run(`
    INSERT OR IGNORE INTO embedding_meta (key, value)
    VALUES ('embedding_dim', '256')
  `);
}
```

### Step 6: Call createEmbeddingsTable in createDb

Add after `createSearchIndex(sqliteInstance);`:

```typescript
// Create embeddings table for semantic search
createEmbeddingsTable(sqliteInstance);
```

### Step 7: Add migration for existing databases

Add new function:

```typescript
function migrateEmbeddingsTable(sqlite: Database): void {
  const tableExists = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='embedding_meta'")
    .get();

  if (!tableExists) {
    createEmbeddingsTable(sqlite);
  }
}
```

Call it in `getDb` after `migrateHistoryTable(sqliteInstance);`:

```typescript
migrateEmbeddingsTable(sqliteInstance);
```

### Step 8: Add helper functions for embeddings

```typescript
export function getEmbedding(entityId: string): Float32Array | null {
  const sqlite = requireSqliteInstance();
  const result = sqlite.query(
    'SELECT embedding FROM embeddings WHERE entity_id = ?'
  ).get(entityId) as { embedding: Float32Array } | null;
  return result?.embedding ?? null;
}

export function upsertEmbedding(
  entityId: string,
  entityType: string,
  embedding: Float32Array
): void {
  const sqlite = requireSqliteInstance();
  sqlite.run(
    'INSERT OR REPLACE INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)',
    entityId, entityType, embedding
  );
}

export function deleteEmbedding(entityId: string): void {
  const sqlite = requireSqliteInstance();
  sqlite.run('DELETE FROM embeddings WHERE entity_id = ?', entityId);
}
```

### Step 9: Run existing tests to verify no regression

Run: `bun test`
Expected: All existing tests pass

### Step 10: Commit

```bash
git add package.json bun.lockb src/db/client.ts
git commit -m "$(cat <<'EOF'
feat: add sqlite-vec extension and embeddings table

- Add sqlite-vec dependency for vector storage
- Create embeddings virtual table with vec0 (256-dim)
- Add embedding_meta table for model versioning
- Add migration for existing databases
- Export helper functions: getEmbedding, upsertEmbedding, deleteEmbedding

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: TREK-25 - Implement EmbeddingService with Transformers.js

**Files:**
- Create: `src/services/embedding.ts`

### Step 1: Add transformers dependency

```bash
bun add @huggingface/transformers
```

### Step 2: Create embedding service file

Create `src/services/embedding.ts`:

```typescript
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const MODEL_ID = 'onnx-community/embeddinggemma-300m-ONNX';
const EMBEDDING_DIM = 256;

let extractor: FeatureExtractionPipeline | null = null;
let initPromise: Promise<void> | null = null;
let initFailed = false;

function getCacheDir(): string {
  const cacheDir = join(homedir(), '.trekker', 'models');
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

function truncateAndNormalize(embedding: number[], dim: number): Float32Array {
  // Truncate to desired dimension (MRL)
  const truncated = embedding.slice(0, dim);

  // Re-normalize after truncation
  const norm = Math.sqrt(truncated.reduce((sum, val) => sum + val * val, 0));
  const normalized = truncated.map(val => val / norm);

  return new Float32Array(normalized);
}

async function initializeExtractor(): Promise<void> {
  if (extractor) return;
  if (initFailed) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      console.error('Loading embedding model (first time may download ~200MB)...');
      extractor = await pipeline('feature-extraction', MODEL_ID, {
        cache_dir: getCacheDir(),
        quantized: true,
      });
      console.error('Embedding model loaded.');
    } catch (error) {
      initFailed = true;
      console.error('Failed to load embedding model:', error);
      throw error;
    }
  })();

  await initPromise;
}

export async function embed(text: string): Promise<Float32Array> {
  await initializeExtractor();

  if (!extractor) {
    throw new Error('Embedding model not available');
  }

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true
  });

  // output.data is the raw embedding array
  const rawEmbedding = Array.from(output.data as Float32Array);
  return truncateAndNormalize(rawEmbedding, EMBEDDING_DIM);
}

export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  await initializeExtractor();

  if (!extractor) {
    throw new Error('Embedding model not available');
  }

  const results: Float32Array[] = [];

  // Process in small batches to avoid memory issues
  const batchSize = 8;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const outputs = await Promise.all(
      batch.map(text => extractor!(text, { pooling: 'mean', normalize: true }))
    );

    for (const output of outputs) {
      const rawEmbedding = Array.from(output.data as Float32Array);
      results.push(truncateAndNormalize(rawEmbedding, EMBEDDING_DIM));
    }
  }

  return results;
}

export function isModelAvailable(): boolean {
  return extractor !== null && !initFailed;
}

export function getEmbeddingDimension(): number {
  return EMBEDDING_DIM;
}

export async function ensureModelLoaded(): Promise<boolean> {
  try {
    await initializeExtractor();
    return true;
  } catch {
    return false;
  }
}
```

### Step 3: Verify module compiles

Run: `bun run src/services/embedding.ts`
Expected: No syntax errors (may warn about no main)

### Step 4: Commit

```bash
git add package.json bun.lockb src/services/embedding.ts
git commit -m "$(cat <<'EOF'
feat: implement EmbeddingService with Transformers.js

- Add @huggingface/transformers dependency
- Create embedding.ts with lazy model loading
- Use EmbeddingGemma 300M ONNX model
- Truncate to 256 dims via MRL for efficiency
- Model cached in ~/.trekker/models/
- Graceful handling of model load failures

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TREK-26 - Create semantic-search service and command

**Files:**
- Create: `src/services/semantic-search.ts`
- Create: `src/commands/semantic-search.ts`
- Modify: `src/index.ts`

### Step 1: Create semantic search service

Create `src/services/semantic-search.ts`:

```typescript
import { requireSqliteInstance } from '../db/client';
import { embed, ensureModelLoaded } from './embedding';
import type { SearchEntityType } from '../types';
import { PAGINATION_DEFAULTS } from '../types';

export interface SemanticSearchOptions {
  types?: SearchEntityType[];
  status?: string;
  limit?: number;
  page?: number;
  threshold?: number;
}

export interface SemanticSearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  similarity: number;
  status: string | null;
  parentId: string | null;
}

export interface SemanticSearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: SemanticSearchResult[];
  mode: 'semantic';
}

export async function semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResponse> {
  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    throw new Error('Semantic search unavailable: embedding model failed to load');
  }

  const sqlite = requireSqliteInstance();
  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;
  const threshold = options?.threshold ?? 0.5;

  // Generate query embedding
  const queryEmbedding = await embed(query);

  // Build filter conditions
  let typeFilter = '';
  const params: (string | number | Float32Array)[] = [queryEmbedding];

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => '?').join(', ');
    typeFilter = `AND e.entity_type IN (${placeholders})`;
    params.push(...options.types);
  }

  // Query with cosine distance
  // Note: vec_distance_cosine returns distance (0 = identical, 2 = opposite)
  // We convert to similarity: 1 - (distance / 2)
  const searchQuery = `
    SELECT
      e.entity_id,
      e.entity_type,
      vec_distance_cosine(e.embedding, ?) as distance,
      COALESCE(t.title, ep.title) as title,
      COALESCE(t.status, ep.status) as status,
      COALESCE(t.parent_task_id, t.epic_id) as parent_id
    FROM embeddings e
    LEFT JOIN tasks t ON e.entity_id = t.id AND e.entity_type IN ('task', 'subtask')
    LEFT JOIN epics ep ON e.entity_id = ep.id AND e.entity_type = 'epic'
    LEFT JOIN comments c ON e.entity_id = c.id AND e.entity_type = 'comment'
    WHERE 1=1 ${typeFilter}
    ORDER BY distance ASC
  `;

  const allResults = sqlite.query(searchQuery).all(...params) as Array<{
    entity_id: string;
    entity_type: string;
    distance: number;
    title: string | null;
    status: string | null;
    parent_id: string | null;
  }>;

  // Filter by threshold and status, calculate similarity
  let filtered = allResults
    .map(r => ({
      ...r,
      similarity: 1 - (r.distance / 2)
    }))
    .filter(r => r.similarity >= threshold);

  if (options?.status) {
    filtered = filtered.filter(r => r.status === options.status);
  }

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  return {
    query,
    total,
    page,
    limit,
    mode: 'semantic',
    results: paged.map(r => ({
      type: r.entity_type as SearchEntityType,
      id: r.entity_id,
      title: r.title,
      similarity: Math.round(r.similarity * 100) / 100,
      status: r.status,
      parentId: r.parent_id,
    })),
  };
}

export async function indexEntity(
  entityId: string,
  entityType: SearchEntityType,
  text: string
): Promise<void> {
  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    console.error(`Skipping embedding for ${entityId}: model not available`);
    return;
  }

  const sqlite = requireSqliteInstance();
  const embedding = await embed(text);

  sqlite.run(
    'INSERT OR REPLACE INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)',
    entityId, entityType, embedding
  );
}

export function removeEntityIndex(entityId: string): void {
  const sqlite = requireSqliteInstance();
  sqlite.run('DELETE FROM embeddings WHERE entity_id = ?', entityId);
}
```

### Step 2: Create semantic search command

Create `src/commands/semantic-search.ts`:

```typescript
import { Command } from 'commander';
import { semanticSearch, type SemanticSearchResponse } from '../services/semantic-search';
import type { SearchEntityType } from '../types';
import { handleCommandError, outputResult } from '../utils/output';
import { validatePagination, validateSearchEntityTypes } from '../utils/validator';

export const semanticSearchCommand = new Command('semantic-search')
  .description('Search using semantic similarity (finds related items by meaning)')
  .argument('<query>', 'Natural language search query')
  .option('--type <types>', 'Filter by type: epic,task,subtask,comment (comma-separated)')
  .option('--status <status>', 'Filter by status')
  .option('--threshold <n>', 'Minimum similarity threshold 0-1 (default: 0.5)', '0.5')
  .option('--limit <n>', 'Results per page (default: 20)', '20')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .action(async (query, options) => {
    try {
      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      const threshold = parseFloat(options.threshold);

      validatePagination(limit, page);

      if (threshold < 0 || threshold > 1) {
        throw new Error('Threshold must be between 0 and 1');
      }

      const types = options.type
        ? options.type.split(',').map((t: string) => t.trim())
        : undefined;

      if (types) validateSearchEntityTypes(types);

      const result = await semanticSearch(query, {
        types: types as SearchEntityType[] | undefined,
        status: options.status,
        threshold,
        limit,
        page,
      });

      outputResult(result, formatSemanticResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatSemanticResults(result: SemanticSearchResponse): string {
  const lines: string[] = [];

  lines.push(`Semantic Search: "${result.query}"`);
  lines.push(`Found ${result.total} results (page ${result.page}, ${result.limit} per page)`);
  lines.push('');

  if (result.results.length === 0) {
    lines.push('No semantically similar results found.');
    return lines.join('\n');
  }

  for (const r of result.results) {
    const typeLabel = r.type.toUpperCase().padEnd(7);
    const similarityLabel = `[${(r.similarity).toFixed(2)}]`;
    const statusLabel = r.status ? ` [${r.status}]` : '';
    const parentLabel = r.parentId ? ` (parent: ${r.parentId})` : '';

    lines.push(`${typeLabel} ${r.id} ${similarityLabel}${statusLabel}${parentLabel}`);
    if (r.title) {
      lines.push(`  ${r.title}`);
    }
    lines.push('');
  }

  const totalPages = Math.ceil(result.total / result.limit);
  if (totalPages > 1) {
    lines.push(`Page ${result.page} of ${totalPages}`);
  }

  return lines.join('\n');
}
```

### Step 3: Register command in index.ts

Modify `src/index.ts` - add import:

```typescript
import { semanticSearchCommand } from './commands/semantic-search';
```

Add registration (after searchCommand):

```typescript
program.addCommand(semanticSearchCommand);
```

### Step 4: Verify command is registered

Run: `bun run dev semantic-search --help`
Expected: Shows semantic-search help with options

### Step 5: Commit

```bash
git add src/services/semantic-search.ts src/commands/semantic-search.ts src/index.ts
git commit -m "$(cat <<'EOF'
feat: add semantic-search command

- Create semantic-search service with vector similarity
- Add semantic-search CLI command
- Support --type, --status, --threshold filters
- Pagination support
- TOON output format support

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: TREK-27 - Add similar command for duplicate detection

**Files:**
- Create: `src/commands/similar.ts`
- Modify: `src/index.ts`

### Step 1: Create similar command

Create `src/commands/similar.ts`:

```typescript
import { Command } from 'commander';
import { semanticSearch } from '../services/semantic-search';
import { getTask } from '../services/task';
import { getEpic } from '../services/epic';
import { embed, ensureModelLoaded } from '../services/embedding';
import { requireSqliteInstance } from '../db/client';
import { handleCommandError, outputResult } from '../utils/output';

interface SimilarResult {
  id: string;
  type: string;
  title: string | null;
  similarity: number;
  status: string | null;
}

interface SimilarResponse {
  sourceId?: string;
  sourceText?: string;
  threshold: number;
  results: SimilarResult[];
}

export const similarCommand = new Command('similar')
  .description('Find similar tasks/epics to detect duplicates')
  .argument('<id-or-text>', 'Task/Epic ID (e.g., TREK-1) or text to find similar items for')
  .option('--threshold <n>', 'Minimum similarity threshold 0-1 (default: 0.7)', '0.7')
  .option('--limit <n>', 'Maximum results (default: 10)', '10')
  .action(async (idOrText, options) => {
    try {
      const threshold = parseFloat(options.threshold);
      const limit = parseInt(options.limit, 10);

      if (threshold < 0 || threshold > 1) {
        throw new Error('Threshold must be between 0 and 1');
      }

      let searchText: string;
      let sourceId: string | undefined;

      // Check if input is an ID or text
      if (idOrText.match(/^(TREK|EPIC)-\d+$/i)) {
        sourceId = idOrText.toUpperCase();

        // Get the entity to find its text
        if (sourceId.startsWith('TREK')) {
          const task = getTask(sourceId);
          if (!task) throw new Error(`Task not found: ${sourceId}`);
          searchText = `${task.title} ${task.description ?? ''}`.trim();
        } else {
          const epic = getEpic(sourceId);
          if (!epic) throw new Error(`Epic not found: ${sourceId}`);
          searchText = `${epic.title} ${epic.description ?? ''}`.trim();
        }
      } else {
        searchText = idOrText;
      }

      const modelReady = await ensureModelLoaded();
      if (!modelReady) {
        throw new Error('Similar search unavailable: embedding model failed to load');
      }

      const sqlite = requireSqliteInstance();
      const queryEmbedding = await embed(searchText);

      // Query for similar items
      const searchQuery = `
        SELECT
          e.entity_id,
          e.entity_type,
          vec_distance_cosine(e.embedding, ?) as distance,
          COALESCE(t.title, ep.title) as title,
          COALESCE(t.status, ep.status) as status
        FROM embeddings e
        LEFT JOIN tasks t ON e.entity_id = t.id AND e.entity_type IN ('task', 'subtask')
        LEFT JOIN epics ep ON e.entity_id = ep.id AND e.entity_type = 'epic'
        WHERE e.entity_type IN ('task', 'subtask', 'epic')
        ORDER BY distance ASC
        LIMIT ?
      `;

      const rawResults = sqlite.query(searchQuery).all(queryEmbedding, limit + 1) as Array<{
        entity_id: string;
        entity_type: string;
        distance: number;
        title: string | null;
        status: string | null;
      }>;

      // Convert distance to similarity and filter
      const results = rawResults
        .map(r => ({
          id: r.entity_id,
          type: r.entity_type,
          title: r.title,
          similarity: Math.round((1 - r.distance / 2) * 100) / 100,
          status: r.status,
        }))
        .filter(r => r.similarity >= threshold)
        // Exclude the source item itself
        .filter(r => r.id !== sourceId)
        .slice(0, limit);

      const response: SimilarResponse = {
        sourceId,
        sourceText: sourceId ? undefined : searchText.slice(0, 100),
        threshold,
        results,
      };

      outputResult(response, formatSimilarResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

function formatSimilarResults(response: SimilarResponse): string {
  const lines: string[] = [];

  if (response.sourceId) {
    lines.push(`Similar to: ${response.sourceId}`);
  } else {
    lines.push(`Similar to: "${response.sourceText}..."`);
  }
  lines.push(`Threshold: ${response.threshold}`);
  lines.push('');

  if (response.results.length === 0) {
    lines.push('No similar items found above threshold.');
    lines.push('');
    lines.push('Tip: Try lowering --threshold (e.g., --threshold 0.5)');
    return lines.join('\n');
  }

  lines.push('Potential duplicates/related items:');
  lines.push('');

  for (const r of response.results) {
    const similarityPct = Math.round(r.similarity * 100);
    const indicator = similarityPct >= 90 ? '!!' : similarityPct >= 80 ? '!' : '';
    const statusLabel = r.status ? ` [${r.status}]` : '';

    lines.push(`${r.id.padEnd(10)} [${similarityPct}%]${indicator}${statusLabel}`);
    if (r.title) {
      lines.push(`  ${r.title}`);
    }

    if (similarityPct >= 90) {
      lines.push('  → LIKELY DUPLICATE - review before creating');
    } else if (similarityPct >= 80) {
      lines.push('  → Highly related - check if same issue');
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

### Step 2: Add import for getEpic

Create or verify `src/services/epic.ts` exports `getEpic`:

```typescript
// Should already exist, verify it exports getEpic
export function getEpic(id: string): Epic | undefined {
  // ...
}
```

### Step 3: Register command in index.ts

Add import:

```typescript
import { similarCommand } from './commands/similar';
```

Add registration:

```typescript
program.addCommand(similarCommand);
```

### Step 4: Verify command works

Run: `bun run dev similar --help`
Expected: Shows similar command help

### Step 5: Commit

```bash
git add src/commands/similar.ts src/index.ts
git commit -m "$(cat <<'EOF'
feat: add similar command for duplicate detection

- Find similar tasks/epics by ID or text
- Configurable similarity threshold
- Shows duplicate likelihood indicators
- Helps prevent redundant task creation

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: TREK-28 - Add --mode flag to existing search command

**Files:**
- Modify: `src/commands/search.ts`
- Modify: `src/services/search.ts`

### Step 1: Update SearchOptions type

Modify `src/services/search.ts` - update interface:

```typescript
export interface SearchOptions {
  types?: SearchEntityType[];
  status?: string;
  limit?: number;
  page?: number;
  mode?: 'keyword' | 'semantic' | 'hybrid';
}
```

### Step 2: Add hybrid search function

Add to `src/services/search.ts`:

```typescript
import { semanticSearch } from './semantic-search';
import { ensureModelLoaded } from './embedding';

export async function hybridSearch(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;

  // Get keyword results
  const keywordResults = search(query, { ...options, limit: limit * 2 });

  // Try to get semantic results
  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    // Fall back to keyword-only
    return keywordResults;
  }

  const semanticResults = await semanticSearch(query, {
    ...options,
    limit: limit * 2,
    threshold: 0.4
  });

  // Combine and dedupe results
  const combined = new Map<string, {
    keywordScore: number;
    semanticScore: number;
    result: SearchResult
  }>();

  // Add keyword results (normalize score)
  const maxKeyword = Math.max(...keywordResults.results.map(r => r.score), 1);
  for (const r of keywordResults.results) {
    combined.set(r.id, {
      keywordScore: r.score / maxKeyword,
      semanticScore: 0,
      result: r
    });
  }

  // Add/merge semantic results
  for (const r of semanticResults.results) {
    const existing = combined.get(r.id);
    if (existing) {
      existing.semanticScore = r.similarity;
    } else {
      combined.set(r.id, {
        keywordScore: 0,
        semanticScore: r.similarity,
        result: {
          type: r.type,
          id: r.id,
          title: r.title,
          snippet: r.title ?? '',
          score: 0,
          status: r.status,
          parentId: r.parentId
        }
      });
    }
  }

  // Calculate hybrid score: 0.3 * keyword + 0.7 * semantic
  const alpha = 0.3;
  const scored = Array.from(combined.values())
    .map(item => ({
      ...item.result,
      score: (alpha * item.keywordScore) + ((1 - alpha) * item.semanticScore)
    }))
    .sort((a, b) => b.score - a.score);

  const offset = (page - 1) * limit;
  const paged = scored.slice(offset, offset + limit);

  return {
    query,
    total: scored.length,
    page,
    limit,
    results: paged
  };
}
```

### Step 3: Update search command with --mode

Modify `src/commands/search.ts`:

```typescript
import { search, hybridSearch, rebuildSearchIndex } from '../services/search';
import { semanticSearch } from '../services/semantic-search';

export const searchCommand = new Command('search')
  .description('Search across epics, tasks, subtasks, and comments')
  .argument('<query>', 'Search query')
  .option('--type <types>', 'Filter by type: epic,task,subtask,comment (comma-separated)')
  .option('--status <status>', 'Filter by status')
  .option('--mode <mode>', 'Search mode: keyword, semantic, or hybrid (default: keyword)', 'keyword')
  .option('--limit <n>', 'Results per page (default: 20)', '20')
  .option('--page <n>', 'Page number (default: 1)', '1')
  .option('--rebuild-index', 'Rebuild the search index before searching')
  .action(async (query, options) => {
    try {
      if (options.rebuildIndex) {
        rebuildSearchIndex();
      }

      const limit = parseInt(options.limit, 10);
      const page = parseInt(options.page, 10);
      validatePagination(limit, page);

      const types = options.type
        ? options.type.split(',').map((t: string) => t.trim())
        : undefined;

      if (types) validateSearchEntityTypes(types);

      const searchOptions = {
        types: types as SearchEntityType[] | undefined,
        status: options.status,
        limit,
        page,
      };

      let result;
      switch (options.mode) {
        case 'semantic':
          result = await semanticSearch(query, { ...searchOptions, threshold: 0.5 });
          break;
        case 'hybrid':
          result = await hybridSearch(query, searchOptions);
          break;
        case 'keyword':
        default:
          result = search(query, searchOptions);
          break;
      }

      outputResult(result, formatSearchResults);
    } catch (err) {
      handleCommandError(err);
    }
  });
```

### Step 4: Test mode flag

Run: `bun run dev search --help`
Expected: Shows --mode option

### Step 5: Commit

```bash
git add src/commands/search.ts src/services/search.ts
git commit -m "$(cat <<'EOF'
feat: add --mode flag to search command

- keyword: FTS5 search (default, backwards compatible)
- semantic: Pure vector similarity search
- hybrid: Combined keyword + semantic scoring

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: TREK-29 - Hook embedding generation into task/epic services

**Files:**
- Modify: `src/services/task.ts`
- Modify: `src/services/epic.ts`
- Modify: `src/services/comment.ts`

### Step 1: Update task service

Modify `src/services/task.ts` - add import:

```typescript
import { indexEntity, removeEntityIndex } from './semantic-search';
```

Update `createTask` - add before return:

```typescript
// Index for semantic search (non-blocking)
indexEntity(id, input.parentTaskId ? 'subtask' : 'task',
  `${input.title} ${input.description ?? ''}`).catch(() => {});

return task as Task;
```

Update `updateTask` - add before return:

```typescript
// Re-index if text changed
if (input.title !== undefined || input.description !== undefined) {
  const updated = getTask(id)!;
  indexEntity(id, updated.parentTaskId ? 'subtask' : 'task',
    `${updated.title} ${updated.description ?? ''}`).catch(() => {});
}

return getTask(id)!;
```

Update `deleteTask` - add before delete:

```typescript
// Remove from semantic index
removeEntityIndex(id);

db.delete(tasks).where(eq(tasks.id, id)).run();
```

### Step 2: Update epic service

Modify `src/services/epic.ts` - add import:

```typescript
import { indexEntity, removeEntityIndex } from './semantic-search';
```

Apply same pattern to `createEpic`, `updateEpic`, `deleteEpic`.

### Step 3: Update comment service

Modify `src/services/comment.ts` - add import and apply pattern for comments.

### Step 4: Run tests to verify no regression

Run: `bun test`
Expected: All tests pass

### Step 5: Commit

```bash
git add src/services/task.ts src/services/epic.ts src/services/comment.ts
git commit -m "$(cat <<'EOF'
feat: auto-generate embeddings on task/epic/comment changes

- Index new entities on create
- Re-index on update if text changed
- Remove from index on delete
- Non-blocking async operations

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: TREK-30 - Add reindex and status commands

**Files:**
- Create: `src/commands/reindex.ts`
- Modify: `src/index.ts`

### Step 1: Create reindex command

Create `src/commands/reindex.ts`:

```typescript
import { Command } from 'commander';
import { requireSqliteInstance } from '../db/client';
import { embedBatch, ensureModelLoaded } from '../services/embedding';
import { handleCommandError } from '../utils/output';

export const reindexCommand = new Command('reindex')
  .description('Rebuild search indexes')
  .option('--embeddings', 'Rebuild semantic search embeddings')
  .option('--all', 'Rebuild all indexes (FTS5 + embeddings)')
  .action(async (options) => {
    try {
      if (!options.embeddings && !options.all) {
        console.log('Specify --embeddings or --all');
        return;
      }

      if (options.embeddings || options.all) {
        await reindexEmbeddings();
      }
    } catch (err) {
      handleCommandError(err);
    }
  });

async function reindexEmbeddings(): Promise<void> {
  console.log('Rebuilding semantic search index...');

  const modelReady = await ensureModelLoaded();
  if (!modelReady) {
    throw new Error('Cannot reindex: embedding model failed to load');
  }

  const sqlite = requireSqliteInstance();

  // Clear existing embeddings
  sqlite.run('DELETE FROM embeddings');

  // Get all entities to index
  const tasks = sqlite.query(`
    SELECT id, parent_task_id, title, description FROM tasks
  `).all() as Array<{ id: string; parent_task_id: string | null; title: string; description: string | null }>;

  const epics = sqlite.query(`
    SELECT id, title, description FROM epics
  `).all() as Array<{ id: string; title: string; description: string | null }>;

  const comments = sqlite.query(`
    SELECT id, content FROM comments
  `).all() as Array<{ id: string; content: string }>;

  const total = tasks.length + epics.length + comments.length;
  console.log(`Indexing ${total} entities...`);

  // Index tasks
  const taskTexts = tasks.map(t => `${t.title} ${t.description ?? ''}`);
  const taskEmbeddings = await embedBatch(taskTexts);

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const entityType = task.parent_task_id ? 'subtask' : 'task';
    sqlite.run(
      'INSERT INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)',
      task.id, entityType, taskEmbeddings[i]
    );
  }
  console.log(`  ✓ ${tasks.length} tasks indexed`);

  // Index epics
  const epicTexts = epics.map(e => `${e.title} ${e.description ?? ''}`);
  const epicEmbeddings = await embedBatch(epicTexts);

  for (let i = 0; i < epics.length; i++) {
    sqlite.run(
      'INSERT INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)',
      epics[i].id, 'epic', epicEmbeddings[i]
    );
  }
  console.log(`  ✓ ${epics.length} epics indexed`);

  // Index comments
  const commentEmbeddings = await embedBatch(comments.map(c => c.content));

  for (let i = 0; i < comments.length; i++) {
    sqlite.run(
      'INSERT INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)',
      comments[i].id, 'comment', commentEmbeddings[i]
    );
  }
  console.log(`  ✓ ${comments.length} comments indexed`);

  // Update metadata
  sqlite.run(
    "INSERT OR REPLACE INTO embedding_meta (key, value) VALUES ('last_reindex', ?)",
    new Date().toISOString()
  );

  console.log(`\nReindex complete. ${total} entities indexed.`);
}
```

### Step 2: Register command

Add to `src/index.ts`:

```typescript
import { reindexCommand } from './commands/reindex';
// ...
program.addCommand(reindexCommand);
```

### Step 3: Test command

Run: `bun run dev reindex --help`
Expected: Shows reindex options

### Step 4: Commit

```bash
git add src/commands/reindex.ts src/index.ts
git commit -m "$(cat <<'EOF'
feat: add reindex command for embedding maintenance

- Rebuild all semantic embeddings with --embeddings
- Progress reporting during reindex
- Updates last_reindex timestamp in metadata

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: TREK-31 - Add MCP tools to Claude Code plugin

**Files:**
- Create: `../trekker-claude-code/mcp-server/src/tools/search.ts`
- Modify: `../trekker-claude-code/mcp-server/src/index.ts`

### Step 1: Create search tools file

Create `../trekker-claude-code/mcp-server/src/tools/search.ts`:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { runTrekker } from '../cli-runner.js';

export function registerSearchTools(server: McpServer): void {
  // Semantic search tool
  server.tool(
    'trekker_semantic_search',
    'Search tasks and epics by meaning using AI embeddings. Finds related items even without exact keyword matches.',
    {
      query: {
        type: 'string',
        description: 'Natural language query describing what you are looking for'
      },
      type: {
        type: 'string',
        description: 'Filter by entity type: epic, task, subtask, comment (comma-separated)',
        optional: true
      },
      status: {
        type: 'string',
        description: 'Filter by status: todo, in_progress, completed, etc.',
        optional: true
      },
      threshold: {
        type: 'number',
        description: 'Minimum similarity threshold 0-1 (default: 0.5)',
        optional: true
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return (default: 10)',
        optional: true
      }
    },
    async ({ query, type, status, threshold, limit }) => {
      const args = ['semantic-search', query, '--toon'];
      if (type) args.push('--type', type);
      if (status) args.push('--status', status);
      if (threshold !== undefined) args.push('--threshold', String(threshold));
      if (limit !== undefined) args.push('--limit', String(limit));

      return runTrekker(args);
    }
  );

  // Find similar/duplicates tool
  server.tool(
    'trekker_find_similar',
    'Find tasks similar to a given task ID or text. Use to detect duplicates before creating new tasks.',
    {
      idOrText: {
        type: 'string',
        description: 'Task/Epic ID (e.g., TREK-1) or text description to find similar items for'
      },
      threshold: {
        type: 'number',
        description: 'Minimum similarity threshold 0-1 (default: 0.7)',
        optional: true
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return (default: 10)',
        optional: true
      }
    },
    async ({ idOrText, threshold, limit }) => {
      const args = ['similar', idOrText, '--toon'];
      if (threshold !== undefined) args.push('--threshold', String(threshold));
      if (limit !== undefined) args.push('--limit', String(limit));

      return runTrekker(args);
    }
  );

  // Hybrid search tool
  server.tool(
    'trekker_hybrid_search',
    'Search using combined keyword and semantic matching for best results.',
    {
      query: {
        type: 'string',
        description: 'Search query'
      },
      type: {
        type: 'string',
        description: 'Filter by entity type (comma-separated)',
        optional: true
      },
      status: {
        type: 'string',
        description: 'Filter by status',
        optional: true
      },
      limit: {
        type: 'number',
        description: 'Maximum results (default: 20)',
        optional: true
      }
    },
    async ({ query, type, status, limit }) => {
      const args = ['search', query, '--mode', 'hybrid', '--toon'];
      if (type) args.push('--type', type);
      if (status) args.push('--status', status);
      if (limit !== undefined) args.push('--limit', String(limit));

      return runTrekker(args);
    }
  );
}
```

### Step 2: Register in index.ts

Modify `../trekker-claude-code/mcp-server/src/index.ts`:

```typescript
import { registerSearchTools } from './tools/search.js';

// ... existing registrations ...
registerSearchTools(server);
```

### Step 3: Build and test

```bash
cd ../trekker-claude-code/mcp-server
pnpm build
```

### Step 4: Commit

```bash
cd ../trekker-claude-code
git add mcp-server/src/tools/search.ts mcp-server/src/index.ts
git commit -m "$(cat <<'EOF'
feat: add semantic search MCP tools

- trekker_semantic_search: AI-powered meaning-based search
- trekker_find_similar: Duplicate detection tool
- trekker_hybrid_search: Combined keyword + semantic search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: TREK-32 - Create semantic search skills for Claude Code plugin

**Files:**
- Create: `../trekker-claude-code/skills/semantic-search/semantic-search.md`
- Create: `../trekker-claude-code/skills/find-duplicates/find-duplicates.md`
- Create: `../trekker-claude-code/skills/smart-query/smart-query.md`

### Step 1: Create semantic-search skill

Create directory and file:

```bash
mkdir -p ../trekker-claude-code/skills/semantic-search
```

Create `../trekker-claude-code/skills/semantic-search/semantic-search.md` with the full skill content from the design document (Section 7, Skill 1).

### Step 2: Create find-duplicates skill

```bash
mkdir -p ../trekker-claude-code/skills/find-duplicates
```

Create `../trekker-claude-code/skills/find-duplicates/find-duplicates.md` with the full skill content from the design document (Section 7, Skill 2).

### Step 3: Create smart-query skill

```bash
mkdir -p ../trekker-claude-code/skills/smart-query
```

Create `../trekker-claude-code/skills/smart-query/smart-query.md` with the full skill content from the design document (Section 7, Skill 3).

### Step 4: Commit

```bash
cd ../trekker-claude-code
git add skills/
git commit -m "$(cat <<'EOF'
feat: add semantic search skills

- semantic-search: Find by meaning, not keywords
- find-duplicates: Detect duplicate tasks
- smart-query: Natural language task queries

Comprehensive documentation with workflows, examples, and score guides.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: TREK-33 - Write tests for semantic search

**Files:**
- Create: `tests/commands/semantic-search.test.ts`
- Create: `tests/commands/similar.test.ts`

### Step 1: Create semantic search tests

Create `tests/commands/semantic-search.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

interface SemanticSearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  mode: string;
  results: Array<{
    id: string;
    type: string;
    title: string | null;
    similarity: number;
    status: string | null;
  }>;
}

describe('semantic-search command', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe('basic semantic search', () => {
    it('should find semantically related tasks', async () => {
      // Create tasks with related concepts
      ctx.run('task create -t "User authentication module"');
      ctx.run('task create -t "Login page UI"');
      ctx.run('task create -t "Database schema design"');

      // Search for auth-related items
      const result = ctx.runToon<SemanticSearchResponse>('semantic-search "user login"');

      expect(result.mode).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);
      // Auth-related tasks should rank higher
    });

    it('should respect type filter', () => {
      ctx.run('epic create -t "Authentication Epic"');
      ctx.run('task create -t "Auth task"');

      const result = ctx.runToon<SemanticSearchResponse>('semantic-search "auth" --type epic');
      expect(result.results.every(r => r.type === 'epic')).toBe(true);
    });

    it('should respect threshold filter', () => {
      ctx.run('task create -t "Very specific task about widgets"');

      const highThreshold = ctx.runToon<SemanticSearchResponse>(
        'semantic-search "authentication" --threshold 0.9'
      );
      const lowThreshold = ctx.runToon<SemanticSearchResponse>(
        'semantic-search "authentication" --threshold 0.3'
      );

      expect(lowThreshold.total).toBeGreaterThanOrEqual(highThreshold.total);
    });
  });
});
```

### Step 2: Create similar command tests

Create `tests/commands/similar.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

interface SimilarResponse {
  sourceId?: string;
  sourceText?: string;
  threshold: number;
  results: Array<{
    id: string;
    type: string;
    title: string | null;
    similarity: number;
  }>;
}

interface Task {
  id: string;
  title: string;
}

describe('similar command', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it('should find similar tasks by ID', () => {
    const task1 = ctx.runToon<Task>('task create -t "Fix login authentication bug"');
    ctx.run('task create -t "Authentication login issue"');
    ctx.run('task create -t "Database migration"');

    const result = ctx.runToon<SimilarResponse>(`similar ${task1.id}`);

    expect(result.sourceId).toBe(task1.id);
    // Should find the similar auth task but not the database one
  });

  it('should find similar tasks by text', () => {
    ctx.run('task create -t "Payment processing error"');
    ctx.run('task create -t "Checkout payment failure"');

    const result = ctx.runToon<SimilarResponse>('similar "payment bug"');

    expect(result.sourceText).toBeDefined();
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should respect threshold parameter', () => {
    ctx.run('task create -t "Specific unique task"');

    const high = ctx.runToon<SimilarResponse>('similar "something else" --threshold 0.9');
    const low = ctx.runToon<SimilarResponse>('similar "something else" --threshold 0.3');

    expect(low.results.length).toBeGreaterThanOrEqual(high.results.length);
  });
});
```

### Step 3: Run tests

```bash
bun test tests/commands/semantic-search.test.ts tests/commands/similar.test.ts
```

### Step 4: Commit

```bash
git add tests/commands/semantic-search.test.ts tests/commands/similar.test.ts
git commit -m "$(cat <<'EOF'
test: add semantic search and similar command tests

- Test semantic search basic functionality
- Test type and threshold filters
- Test similar command with ID and text
- Test duplicate detection scenarios

Part of EPIC-4: Semantic Search

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

After all tasks complete:

```bash
# Run full test suite
bun test

# Manual verification
bun run dev task create -t "User authentication module"
bun run dev task create -t "Login page implementation"
bun run dev task create -t "Database schema"

bun run dev semantic-search "user login"
bun run dev similar "auth bug"
bun run dev search "auth" --mode hybrid
```

---

## Summary

| Task | Description | Depends On |
|------|-------------|------------|
| TREK-24 | sqlite-vec + embeddings table | - |
| TREK-25 | EmbeddingService | TREK-24 |
| TREK-26 | semantic-search command | TREK-25 |
| TREK-27 | similar command | TREK-26 |
| TREK-28 | --mode flag for search | TREK-26 |
| TREK-29 | Hook into services | TREK-25 |
| TREK-30 | reindex command | TREK-29 |
| TREK-31 | MCP tools | TREK-26 |
| TREK-32 | Skills | TREK-31 |
| TREK-33 | Tests | TREK-26 |
