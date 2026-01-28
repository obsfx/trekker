# Semantic Search Architecture in Trekker

A deep dive into how Trekker implements semantic search using EmbeddingGemma, sqlite-vec, and Matryoshka Representation Learning.

## Table of Contents

1. [Overview](#overview)
2. [The Problem with Keyword Search](#the-problem-with-keyword-search)
3. [How Semantic Search Works](#how-semantic-search-works)
4. [Architecture Components](#architecture-components)
5. [The Embedding Model: EmbeddingGemma](#the-embedding-model-embeddinggemma)
6. [Vector Storage: sqlite-vec](#vector-storage-sqlite-vec)
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
│   "auth issues"  ──▶  EmbeddingGemma   ──▶   sqlite-vec        │
│                       (300M params)           (256-dim vectors) │
│                             │                       │           │
│                             ▼                       ▼           │
│                       [0.12, -0.34,          Cosine Distance    │
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

### Measuring Similarity: Cosine Distance

We compare vectors using **cosine distance**:
- **0** = Identical meaning
- **2** = Opposite meaning

```
                     Vector A
                        ↗
                       /
                      /  θ (angle)
                     /
                    ○────────────→ Vector B

    Cosine Distance = 1 - cos(θ)

    Small angle (similar vectors) → Small distance → High similarity
```

We convert distance to similarity for user-friendliness:
```typescript
function distanceToSimilarity(distance: number): number {
  return 1 - distance / 2;  // Maps [0,2] → [1,0]
}
```

---

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Trekker Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────────┐ │
│  │   Commands    │     │   Services    │     │     Database      │ │
│  │               │     │               │     │                   │ │
│  │ semantic-     │────▶│ semantic-     │────▶│ embeddings table  │ │
│  │ search.ts     │     │ search.ts     │     │ (sqlite-vec)      │ │
│  │               │     │               │     │                   │ │
│  │ similar.ts    │────▶│ similar.ts    │     │                   │ │
│  │               │     │               │     │                   │ │
│  │ reindex.ts    │────▶│ embedding.ts  │────▶│ embedding_meta    │ │
│  │               │     │ (model wrapper)│     │ table             │ │
│  └───────────────┘     └───────────────┘     └───────────────────┘ │
│                                                                     │
│         ▲                     ▲                      ▲              │
│         │                     │                      │              │
│    CLI Layer            Business Logic          Data Layer          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/services/embedding.ts` | Wraps Transformers.js, manages model loading |
| `src/services/semantic-search.ts` | Search logic, embedding CRUD |
| `src/services/similar.ts` | Duplicate detection logic |
| `src/db/client.ts` | sqlite-vec setup, vector table management |
| `src/utils/text.ts` | Text utilities (truncation, entity text building) |

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
    quantized: true,  // Use quantized ONNX for smaller size
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

## Vector Storage: sqlite-vec

### Why sqlite-vec?

- **Zero infrastructure**: No separate vector database needed
- **Embedded**: Ships with the SQLite database
- **Fast**: Optimized C implementation
- **Simple**: Just SQL queries

### The Embeddings Table

```sql
CREATE VIRTUAL TABLE embeddings USING vec0(
  entity_id TEXT,        -- e.g., "TREK-1", "EPIC-2"
  entity_type TEXT,      -- "task", "epic", "subtask", "comment"
  embedding float[256]   -- 256-dimensional vector
);
```

### Vector Search Query

```sql
SELECT
  entity_id,
  entity_type,
  vec_distance_cosine(embedding, ?) as distance
FROM embeddings
WHERE vec_distance_cosine(embedding, ?) <= ?  -- threshold
ORDER BY distance ASC
LIMIT ?;
```

### Loading the Extension

```typescript
// src/db/client.ts

import * as sqliteVec from "sqlite-vec";

function loadSqliteVec(sqlite: Database): boolean {
  try {
    sqliteVec.load(sqlite);  // Injects vec0 virtual table support
    return true;
  } catch {
    // Extension loading failed - graceful degradation
    return false;
  }
}
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
   └── indexEntity('TREK-42', 'task', 'Fix OAuth timeout')
       │
       ├── ensureModelLoaded()  // Load model if needed
       │
       ├── embed('Fix OAuth timeout')
       │   └── Returns Float32Array[256]
       │
       └── upsertEmbedding('TREK-42', 'task', embedding)
           └── INSERT INTO embeddings (entity_id, entity_type, embedding)
               VALUES ('TREK-42', 'task', X'...')
```

### When User Searches

```
1. User searches
   └── trekker semantic-search "auth problems"

2. Query embedding generated
   └── embed('auth problems')
       └── Returns Float32Array[256]

3. Vector similarity search
   └── SELECT entity_id, vec_distance_cosine(embedding, ?) as distance
       FROM embeddings
       WHERE vec_distance_cosine(embedding, ?) <= 1.0  -- threshold 0.5
       ORDER BY distance ASC

4. Results enriched with metadata
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
│  │ (FTS5)   │    │ (Vector) │                                  │
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
4. **Graceful degradation**: Falls back to keyword search if model unavailable

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

export function removeEntityIndex(entityId: string): void;
export function distanceToSimilarity(distance: number): number;
```

### Database Helpers

```typescript
// src/db/client.ts

export function isSqliteVecAvailable(): boolean;
export function upsertEmbedding(entityId: string, entityType: string, embedding: Float32Array): void;
export function getEmbedding(entityId: string): EmbeddingRow | null;
export function deleteEmbedding(entityId: string): void;
```

---

## Further Reading

- [EmbeddingGemma Paper](https://ai.google.dev/gemma)
- [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)
- [sqlite-vec Documentation](https://github.com/asg017/sqlite-vec)
- [Transformers.js](https://huggingface.co/docs/transformers.js)
