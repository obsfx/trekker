# Semantic Search Architecture in Trekker

A deep dive into how Trekker implements semantic search using EmbeddingGemma, LanceDB, and Matryoshka Representation Learning.

## Table of Contents

1. [Overview](#overview)
2. [The Problem with Keyword Search](#the-problem-with-keyword-search)
3. [How Semantic Search Works](#how-semantic-search-works)
4. [Architecture Components](#architecture-components)
5. [The Embedding Model: EmbeddingGemma](#the-embedding-model-embeddinggemma)
6. [Vector Storage: LanceDB](#vector-storage-lancedb)
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
│   User Query          Embedding Model         Vector Database   │
│   ───────────         ───────────────         ───────────────   │
│                                                                 │
│   "auth issues"  ──▶  EmbeddingGemma   ──▶   LanceDB           │
│                       (300M params)           (256-dim vectors) │
│                             │                       │           │
│                             ▼                       ▼           │
│                       [0.12, -0.34,          L2 Distance        │
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

### Measuring Similarity: L2 Distance

We compare vectors using **L2 (Euclidean) distance** and convert to similarity:

```
For normalized vectors:
L2² = 2(1 - cosine_similarity)

Therefore:
cosine_similarity = 1 - L2²/2
```

We convert distance to similarity for user-friendliness:
```typescript
function distanceToSimilarity(distance: number): number {
  const similarity = 1 - (distance * distance) / 2;
  return Math.max(0, Math.min(1, similarity));  // Clamp to [0, 1]
}
```

---

## Architecture Components

Trekker uses a **hybrid architecture**: SQLite for relational data, LanceDB for vector embeddings.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Trekker Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────────┐ │
│  │   Commands    │     │   Services    │     │     Databases     │ │
│  │               │     │               │     │                   │ │
│  │ semantic-     │────▶│ semantic-     │────▶│ LanceDB           │ │
│  │ search.ts     │     │ search.ts     │     │ (vectors)         │ │
│  │               │     │               │     │                   │ │
│  │ similar.ts    │────▶│ similar.ts    │────▶│ SQLite            │ │
│  │               │     │               │     │ (metadata)        │ │
│  │ reindex.ts    │────▶│ embedding.ts  │     │                   │ │
│  │               │     │ (model)       │     │                   │ │
│  └───────────────┘     └───────────────┘     └───────────────────┘ │
│                                                                     │
│         ▲                     ▲                      ▲              │
│         │                     │                      │              │
│    CLI Layer            Business Logic          Data Layer          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Hybrid Architecture?

| Concern | SQLite | LanceDB |
|---------|--------|---------|
| Relational data (tasks, epics) | ✅ ACID, constraints | ❌ No unique constraints |
| Vector similarity search | ❌ Requires extensions | ✅ Built-in, fast |
| Cross-platform | ✅ bun:sqlite works everywhere | ✅ NAPI-RS bindings |

### Key Files

| File | Purpose |
|------|---------|
| `src/services/embedding.ts` | Wraps Transformers.js, manages model loading |
| `src/services/semantic-search.ts` | Search logic, indexing entities |
| `src/services/similar.ts` | Duplicate detection logic |
| `src/db/lance.ts` | LanceDB connection and vector operations |
| `src/db/client.ts` | SQLite setup, relational data |
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
    dtype: "fp32",  // Explicit dtype to avoid warnings
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

## Vector Storage: LanceDB

### Why LanceDB?

- **Zero infrastructure**: Embedded vector database
- **Cross-platform**: NAPI-RS bindings work with Bun
- **Fast**: Optimized for vector similarity search
- **Simple**: No extension loading required

### The Embeddings Table

```typescript
// src/db/lance.ts

interface EmbeddingRecord {
  id: string;           // e.g., "TREK-1"
  entity_id: string;    // Same as id
  entity_type: string;  // "task", "epic", "subtask", "comment"
  vector: number[];     // 256-dimensional vector
}
```

### Vector Operations

```typescript
// Insert or update an embedding
export async function upsertEmbedding(
  entityId: string,
  entityType: string,
  embedding: Float32Array
): Promise<void> {
  const table = await getEmbeddingsTable();

  // Delete existing (LanceDB has no unique constraints)
  await table.delete(`entity_id = '${entityId}'`);

  // Insert new
  await table.add([{
    id: entityId,
    entity_id: entityId,
    entity_type: entityType,
    vector: Array.from(embedding),
  }]);
}

// Search for similar embeddings
export async function searchEmbeddings(
  queryVector: Float32Array,
  options: { limit?: number; types?: string[]; distanceThreshold?: number }
): Promise<EmbeddingSearchResult[]> {
  const table = await getEmbeddingsTable();

  let query = table.search(Array.from(queryVector)).limit(options.limit ?? 100);

  const typeFilter = buildTypeFilter(options.types);
  if (typeFilter) {
    query = query.where(typeFilter);
  }

  const results = await query.toArray();
  return filterByDistance(results, options.distanceThreshold);
}
```

### Storage Location

LanceDB stores vectors in `.trekker/vectors/` alongside the SQLite database:

```
.trekker/
├── trekker.db      # SQLite: tasks, epics, comments, etc.
└── vectors/        # LanceDB: embeddings
    └── embeddings/ # Vector table data
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
           └── LanceDB: INSERT into embeddings table
```

### When User Searches

```
1. User searches
   └── trekker semantic-search "auth problems"

2. Query embedding generated
   └── embed('auth problems')
       └── Returns Float32Array[256]

3. Vector similarity search in LanceDB
   └── table.search(queryVector)
           .limit(200)
           .where(typeFilter)
           .toArray()

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
│  │ (FTS5)   │    │ (LanceDB)│                                  │
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
- **Subsequent loads**: 1-3 seconds (from cache)
- **Hot path**: <1ms (already in memory)

### Embedding Generation

- **Per text**: ~50-200ms
- **Batch of 10**: ~300-500ms (not 10× single)

### Vector Search

- **1000 vectors**: ~5ms
- **10000 vectors**: ~20ms
- **100000 vectors**: ~150ms

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
4. **Background tasks**: Errors logged only in debug mode (`TREKKER_DEBUG=1`)

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
export function distanceToSimilarity(distance: number): number;
```

### LanceDB Operations

```typescript
// src/db/lance.ts

export async function getLanceDb(): Promise<lancedb.Connection>;
export async function upsertEmbedding(entityId: string, entityType: string, embedding: Float32Array): Promise<void>;
export async function deleteEmbedding(entityId: string): Promise<void>;
export async function searchEmbeddings(queryVector: Float32Array, options: SearchOptions): Promise<EmbeddingSearchResult[]>;
export async function clearAllEmbeddings(): Promise<void>;
export function isLanceDbAvailable(): boolean;
```

---

## Further Reading

- [EmbeddingGemma Paper](https://ai.google.dev/gemma)
- [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)
- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
