# Semantic Search Architecture in Trekker

A deep dive into how Trekker implements semantic search using EmbeddingGemma, SQLite vector storage, and Matryoshka Representation Learning.

## Table of Contents

1. [Overview](#overview)
2. [The Problem with Keyword Search](#the-problem-with-keyword-search)
3. [How Semantic Search Works](#how-semantic-search-works)
4. [Architecture Components](#architecture-components)
5. [The Embedding Model: EmbeddingGemma](#the-embedding-model-embeddinggemma)
6. [Vector Storage: SQLite](#vector-storage-sqlite)
7. [Matryoshka Representation Learning (MRL)](#matryoshka-representation-learning-mrl)
8. [The Complete Data Flow](#the-complete-data-flow)
9. [Search Modes Explained](#search-modes-explained)
10. [Performance Considerations](#performance-considerations)

---

## Overview

Trekker's semantic search enables finding related tasks even without exact keyword matches. Searching for "authentication" can find tasks about "login", "OAuth", or "credentials" because the system understands meaning, not just words.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Semantic Search Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User Query          Embedding Model         Vector Storage    │
│   ───────────         ───────────────         ───────────────   │
│                                                                 │
│   "auth issues"  ──▶  EmbeddingGemma   ──▶   SQLite BLOB       │
│                       (300M params)           (256-dim vectors) │
│                             │                       │           │
│                             ▼                       ▼           │
│                       [0.12, -0.34,          Cosine Similarity  │
│                        0.56, ...]             Calculation       │
│                       (256 floats)                  │           │
│                                                     ▼           │
│                                              Similar Tasks:     │
│                                              - "Login broken"   │
│                                              - "OAuth timeout"  │
│                                              - "Session bugs"   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Problem with Keyword Search

Traditional keyword search (FTS5 in SQLite) has limitations:

| Query | What User Wants | What Keyword Search Finds |
|-------|-----------------|---------------------------|
| "auth" | Authentication-related tasks | Only tasks containing "auth" |
| "slow" | Performance issues | Misses "latency", "timeout", "bottleneck" |
| "broken login" | Login bugs | Misses "sign-in failed", "authentication error" |

**Keyword search fails when:**
- Users use different terminology than task creators
- Concepts can be expressed multiple ways
- Tasks use technical jargon users don't know

**Semantic search solves this** by comparing meaning rather than words.

---

## How Semantic Search Works

### The Core Idea: Embeddings

An **embedding** is a list of numbers (a vector) that represents the meaning of text. Similar meanings produce similar vectors.

```
Text: "user login"     →  [0.23, -0.15, 0.67, 0.42, ...]  (256 numbers)
Text: "authentication" →  [0.21, -0.18, 0.65, 0.44, ...]  (similar numbers!)
Text: "database index" →  [-0.45, 0.82, -0.11, 0.03, ...] (very different)
```

### Measuring Similarity: Cosine Similarity

We compare vectors using **cosine similarity** (dot product of normalized vectors):

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;  // Returns value in [-1, 1], higher = more similar
}
```

Since our vectors are already normalized (unit length), cosine similarity is just the dot product.

---

## Architecture Components

Trekker uses a **unified SQLite architecture**: all data (relational and vector) lives in one database.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Trekker Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────────┐ │
│  │   Commands    │     │   Services    │     │     Database      │ │
│  │               │     │               │     │                   │ │
│  │ semantic-     │────▶│ semantic-     │────▶│ SQLite            │ │
│  │ search.ts     │     │ search.ts     │     │ (sql.js WASM)     │ │
│  │               │     │               │     │                   │ │
│  │ similar.ts    │────▶│ similar.ts    │────▶│ ├─ tasks          │ │
│  │               │     │               │     │ ├─ epics          │ │
│  │ reindex.ts    │────▶│ embedding.ts  │     │ ├─ embeddings     │ │
│  │               │     │ (model)       │     │ └─ events         │ │
│  └───────────────┘     └───────────────┘     └───────────────────┘ │
│                                                                     │
│         ▲                     ▲                      ▲              │
│         │                     │                      │              │
│    CLI Layer            Business Logic          Data Layer          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Unified SQLite?

| Concern | Previous (LanceDB) | Current (SQLite) |
|---------|-------------------|------------------|
| Native dependencies | Required NAPI-RS bindings | Zero - pure WASM |
| Cross-platform | Platform-specific builds | Works everywhere Node.js runs |
| Complexity | Two databases to sync | Single database file |
| Performance | ~5ms for 1000 vectors | ~1-10ms for 1000 vectors |

For Trekker's scale (hundreds to low thousands of entities), brute-force cosine similarity in JavaScript is fast enough.

### Key Files

| File | Purpose |
|------|---------|
| `src/services/embedding.ts` | Wraps Transformers.js, manages model loading |
| `src/services/semantic-search.ts` | Search logic, indexing entities |
| `src/services/similar.ts` | Duplicate detection logic |
| `src/db/vectors.ts` | SQLite vector storage and similarity search |
| `src/db/client-node.ts` | sql.js (WASM SQLite) setup via Drizzle ORM |
| `src/utils/text.ts` | Text utilities (truncation, entity text building) |
| `src/utils/async.ts` | Background task handling |

---

## The Embedding Model: EmbeddingGemma

### Why EmbeddingGemma?

We chose **EmbeddingGemma 300M** (via ONNX) for several reasons:

| Factor | EmbeddingGemma | Alternatives (MiniLM, etc.) |
|--------|----------------|----------------------------|
| Quality | State-of-the-art | Good but older |
| Size | ~200MB | ~50-100MB |
| Dimension | 768 (truncatable to 256) | Fixed 384 |
| MRL Support | Yes | No |
| Offline | Yes (after download) | Yes |

### Model Loading (Lazy)

The model downloads on first use, not at install time:

```typescript
// src/services/embedding.ts

const MODEL_ID = "onnx-community/embeddinggemma-300m-ONNX";
const CACHE_DIR = join(homedir(), ".trekker", "models");

let extractor: FeatureExtractor | null = null;

export async function ensureModelLoaded(): Promise<boolean> {
  if (extractor) return true;          // Already loaded
  if (modelLoadFailed) return false;   // Don't retry failures
  if (modelLoading) return modelLoading; // Wait for in-progress load

  // Load the model (downloads ~200MB on first run)
  extractor = await pipeline("feature-extraction", MODEL_ID, {
    cache_dir: CACHE_DIR,
    quantized: true,
    dtype: "fp32",
  });

  return true;
}
```

### Generating Embeddings

```typescript
export async function embed(text: string): Promise<Float32Array> {
  await ensureModelLoaded();

  // Generate 768-dimensional embedding
  const output = await extractor(text, {
    pooling: "mean",      // Average all token embeddings
    normalize: true,      // Unit length for cosine similarity
  });

  // Truncate to 256 dimensions using MRL
  return truncateAndNormalize(output.data, 256);
}
```

---

## Vector Storage: SQLite

### Why SQLite for Vectors?

- **Zero dependencies**: No native bindings or platform-specific builds
- **Single file**: Everything in `.trekker/trekker.db`
- **Fast enough**: Brute-force cosine similarity handles Trekker's scale
- **ACID transactions**: Embeddings stay in sync with relational data

### The Embeddings Table

```sql
CREATE TABLE embeddings (
  entity_id TEXT PRIMARY KEY,     -- e.g., "TREK-1"
  entity_type TEXT NOT NULL,      -- "task", "epic", "subtask", "comment"
  vector BLOB NOT NULL            -- 256 × 4 bytes = 1KB per embedding
);
```

### Vector Operations

```typescript
// src/db/vectors.ts

// Serialize Float32Array to BLOB
function serializeVector(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer);
}

// Deserialize BLOB to Float32Array
function deserializeVector(blob: Uint8Array): Float32Array {
  return new Float32Array(
    blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)
  );
}

// Insert or update an embedding
export async function upsertEmbedding(
  entityId: string,
  entityType: string,
  embedding: Float32Array
): Promise<void> {
  const vectorBlob = serializeVector(embedding);
  runSql(
    `INSERT OR REPLACE INTO embeddings (entity_id, entity_type, vector)
     VALUES (?, ?, ?)`,
    [entityId, entityType, vectorBlob]
  );
}

// Search for similar embeddings
export async function searchEmbeddings(
  queryVector: Float32Array,
  options: { limit?: number; types?: string[]; similarityThreshold?: number }
): Promise<EmbeddingSearchResult[]> {
  // Fetch all embeddings (filtered by type if specified)
  const records = querySql<EmbeddingRecord>(sql, params);

  // Compute cosine similarity for each
  const results = records.map((record) => {
    const vector = deserializeVector(record.vector);
    const similarity = cosineSimilarity(queryVector, vector);
    return { entityId: record.entity_id, entityType: record.entity_type, similarity };
  });

  // Sort by similarity (descending) and limit
  return results
    .filter((r) => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

### Storage Location

All data lives in a single SQLite file:

```
.trekker/
└── trekker.db      # SQLite: tasks, epics, comments, embeddings, events
```

---

## Matryoshka Representation Learning (MRL)

### The Problem: Embedding Size

Full embeddings from EmbeddingGemma are **768 dimensions**. For 1000 tasks:
- Storage: 768 × 4 bytes × 1000 = **3MB**
- Search: Comparing 768 numbers per candidate

### The Solution: MRL Truncation

MRL models are trained so that **the first N dimensions contain the most important information**. We can truncate to 256 dimensions with minimal quality loss:

```
Full embedding (768 dims):
[0.12, -0.34, 0.56, 0.78, -0.23, 0.45, ..., 0.11, -0.09]
 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^      ^^^^^^^^^^^^
         Most important info               Less important

Truncated (256 dims):
[0.12, -0.34, 0.56, 0.78, -0.23, 0.45, ..., 0.67]
```

### Re-normalization After Truncation

After truncating, vectors are no longer unit length. We re-normalize:

```typescript
function truncateAndNormalize(
  embedding: Float32Array,
  targetDim: number
): Float32Array {
  // Truncate
  const truncated = embedding.slice(0, targetDim);

  // Calculate magnitude
  let norm = 0;
  for (let i = 0; i < truncated.length; i++) {
    norm += truncated[i] * truncated[i];
  }
  norm = Math.sqrt(norm);

  // Normalize to unit length
  if (norm > 0) {
    for (let i = 0; i < truncated.length; i++) {
      truncated[i] = truncated[i] / norm;
    }
  }

  return truncated;
}
```

### Space Savings

| Dimension | Storage per 1000 tasks | Quality |
|-----------|------------------------|---------|
| 768 | 3MB | 100% |
| 512 | 2MB | ~99% |
| 256 | 1MB | ~97% |
| 128 | 0.5MB | ~93% |

We chose 256 as the sweet spot between quality and efficiency.

---

## The Complete Data Flow

### When a Task is Created

```
1. User creates task
   └── trekker task create -t "Fix OAuth timeout"

2. Task saved to SQLite
   └── INSERT INTO tasks (id, title, ...) VALUES ('TREK-42', 'Fix OAuth timeout', ...)

3. Embedding generated (async, non-blocking)
   └── queueBackgroundTask(indexEntity('TREK-42', 'task', 'Fix OAuth timeout'))
       │
       ├── ensureModelLoaded()  // Load model if needed
       │
       ├── embed('Fix OAuth timeout')
       │   └── Returns Float32Array[256]
       │
       └── upsertEmbedding('TREK-42', 'task', embedding)
           └── SQLite: INSERT OR REPLACE into embeddings table
```

### When User Searches

```
1. User searches
   └── trekker semantic-search "auth problems"

2. Query embedding generated
   └── embed('auth problems')
       └── Returns Float32Array[256]

3. Vector similarity search in SQLite
   └── SELECT entity_id, entity_type, vector FROM embeddings
       │
       └── For each row: cosineSimilarity(queryVector, rowVector)

4. Results enriched with metadata from SQLite
   └── For each result, fetch title/status from tasks/epics table

5. Results returned
   └── TREK-42 [0.89] Fix OAuth timeout
       TREK-18 [0.76] Login session expires
       TREK-31 [0.71] Auth token refresh bug
```

---

## Search Modes Explained

### Keyword Mode (Default)

Uses SQLite FTS5 for fast text matching:

```sql
SELECT * FROM search_index WHERE search_index MATCH 'auth*'
```

**Pros**: Fast, exact matches, no model needed
**Cons**: Misses synonyms and related concepts

### Semantic Mode

Uses vector similarity exclusively:

```typescript
const result = await semanticSearch(query, { threshold: 0.5 });
```

**Pros**: Finds related concepts, natural language queries
**Cons**: Slower, requires model, may miss exact matches

### Hybrid Mode

Combines both approaches with weighted scoring:

```typescript
// Hybrid scoring formula
const alpha = 0.3;  // Weight for keyword score
const hybridScore = alpha * keywordScore + (1 - alpha) * semanticScore;
```

```
┌────────────────────────────────────────────────────────────────┐
│                     Hybrid Search Flow                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│        Query: "auth problems"                                  │
│              │                                                 │
│     ┌────────┴────────┐                                        │
│     ▼                 ▼                                        │
│  ┌──────────┐    ┌──────────┐                                  │
│  │ Keyword  │    │ Semantic │                                  │
│  │ Search   │    │ Search   │                                  │
│  │ (FTS5)   │    │ (SQLite) │                                  │
│  └────┬─────┘    └────┬─────┘                                  │
│       │               │                                        │
│       ▼               ▼                                        │
│   Results A       Results B                                    │
│   (exact match)   (similar meaning)                            │
│       │               │                                        │
│       └───────┬───────┘                                        │
│               ▼                                                │
│        Merge & Score                                           │
│   score = 0.3 × keyword + 0.7 × semantic                       │
│               │                                                │
│               ▼                                                │
│        Final Results                                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

### Model Loading Time

- **First load**: 5-30 seconds (downloads ~200MB)
- **Subsequent loads**: 1-3 seconds (from cache at `~/.trekker/models/`)
- **Hot path**: <1ms (already in memory)

### Embedding Generation

- **Per text**: ~50-200ms
- **Batch of 10**: ~300-500ms (not 10× single)

### Vector Search

For brute-force cosine similarity in JavaScript:

- **100 vectors**: ~1ms
- **1000 vectors**: ~5-10ms
- **10000 vectors**: ~50-100ms

This is fast enough for Trekker's expected scale.

### Memory Usage

| Component | Memory |
|-----------|--------|
| Model (loaded) | ~400MB |
| 1000 embeddings | ~1MB |
| SQLite overhead | ~10MB |

### Optimization Tips

1. **Lazy loading**: Model only loads when semantic features are used
2. **Non-blocking indexing**: Embedding generation doesn't block task creation
3. **Batch reindexing**: `reindex --embeddings` processes in batches
4. **Skip embeddings in tests**: Set `TREKKER_SKIP_EMBEDDINGS=1` for faster tests
5. **Background tasks**: Errors logged only in debug mode (`TREKKER_DEBUG=1`)

---

## Appendix: Key Code Snippets

### The Embedding Service Interface

```typescript
// src/services/embedding.ts

export async function embed(text: string): Promise<Float32Array>;
export async function embedBatch(texts: string[]): Promise<Float32Array[]>;
export async function ensureModelLoaded(options?: { silent?: boolean }): Promise<boolean>;
export function isModelAvailable(): boolean;
export function getEmbeddingDimension(): number;
export function resetModelState(): void;
```

### The Semantic Search Interface

```typescript
// src/services/semantic-search.ts

export async function semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResponse>;

export async function indexEntity(
  entityId: string,
  entityType: SearchEntityType,
  text: string
): Promise<void>;

export async function removeEntityIndex(entityId: string): Promise<void>;
```

### Vector Storage Operations

```typescript
// src/db/vectors.ts

export async function upsertEmbedding(entityId: string, entityType: string, embedding: Float32Array): Promise<void>;
export async function deleteEmbedding(entityId: string): Promise<void>;
export async function searchEmbeddings(queryVector: Float32Array, options: SearchOptions): Promise<EmbeddingSearchResult[]>;
export async function clearAllEmbeddings(): Promise<void>;
export function isVectorStorageAvailable(): boolean;
```

---

## Further Reading

- [EmbeddingGemma](https://ai.google.dev/gemma) - Google's embedding model family
- [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147) - Truncatable embeddings
- [sql.js](https://sql.js.org/) - SQLite compiled to WASM
- [Transformers.js](https://huggingface.co/docs/transformers.js) - Run ML models in JavaScript
