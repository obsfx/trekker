# Semantic Search with Embedded AI Model

**Epic:** EPIC-4
**Status:** Design Complete
**Date:** 2026-01-28

## Overview

Implement advanced semantic search using EmbeddingGemma model (~200MB) embedded in Trekker. This enables:
1. Finding related tasks without exact keyword matches ("authentication" → "login", "OAuth")
2. Natural language queries ("tasks that are stuck", "what needs testing")

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TREKKER CLI                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐ │
│  │  FTS5 Search │     │  Semantic Search │     │ Hybrid Search   │ │
│  │  (existing)  │     │     (new)        │     │  (combines)     │ │
│  └──────────────┘     └────────┬─────────┘     └────────┬────────┘ │
│                                │                         │          │
│                       ┌────────▼─────────┐               │          │
│                       │ EmbeddingService │◄──────────────┘          │
│                       │  (Transformers.js)│                         │
│                       └────────┬─────────┘                          │
│                                │                                     │
│   ┌────────────────────────────▼────────────────────────────────┐  │
│   │                      SQLite Database                         │  │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │  │
│   │  │ FTS5 Index  │    │ vec0 Table  │    │ embedding_meta  │  │  │
│   │  │ (keywords)  │    │ (vectors)   │    │ (model version) │  │  │
│   │  └─────────────┘    └─────────────┘    └─────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE PLUGIN (MCP)                          │
├─────────────────────────────────────────────────────────────────────┤
│  trekker_semantic_search  - Find related items by meaning           │
│  trekker_find_similar     - Find duplicate/similar tasks            │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### New Database Structures

```sql
-- Vector storage using sqlite-vec extension
CREATE VIRTUAL TABLE embeddings USING vec0(
  entity_id TEXT PRIMARY KEY,      -- e.g., "TREK-1", "EPIC-2"
  entity_type TEXT,                -- "task", "epic", "subtask", "comment"
  embedding FLOAT[256]             -- 256-dim (truncated from 768 via MRL)
);

-- Metadata for model versioning & reindexing
CREATE TABLE embedding_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- Stores: model_name, model_version, embedding_dim, last_reindex_at
```

### Why 256 Dimensions?

- EmbeddingGemma supports Matryoshka Representation Learning (MRL)
- Can truncate 768 → 256 with minimal quality loss
- 3x less storage, 3x faster similarity computation
- For task tracking (short texts), 256 is sufficient

### Model Storage

```
~/.trekker/
  └── models/
      └── embeddinggemma-300m-onnx/
          ├── model.onnx (~180MB)
          └── tokenizer.json
```

Stored in user home (not per-project) so it's downloaded once and shared across all projects.

## Embedding Service

### New File: `src/services/embedding.ts`

```typescript
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

class EmbeddingService {
  private extractor: FeatureExtractionPipeline | null = null;
  private readonly MODEL_ID = 'onnx-community/embeddinggemma-300m-ONNX';
  private readonly CACHE_DIR = join(homedir(), '.trekker', 'models');
  private readonly EMBEDDING_DIM = 256; // Truncated via MRL

  async initialize(): Promise<void> {
    if (this.extractor) return;

    this.extractor = await pipeline('feature-extraction', this.MODEL_ID, {
      cache_dir: this.CACHE_DIR,
      quantized: true,  // Use quantized weights (~50% smaller)
    });
  }

  async embed(text: string): Promise<Float32Array> {
    await this.initialize();
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true
    });
    // Truncate to 256 dims (MRL) and re-normalize
    return this.truncateAndNormalize(output.data, this.EMBEDDING_DIM);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    // Process in batches for efficiency
  }
}

export const embeddingService = new EmbeddingService();
```

### Lazy Loading Behavior

1. First semantic search triggers model download (~200MB, one-time)
2. Progress shown: `Downloading embedding model... 45%`
3. Model cached in `~/.trekker/models/`
4. Subsequent runs load from cache (~2-3 seconds cold start)

### Fallback Strategy

- If model fails to load → graceful fallback to FTS5-only search
- Error logged, user notified but not blocked

## Search API

### New Commands

```bash
# Basic semantic search
trekker semantic-search "user login issues"
# → Finds: "authentication bug", "OAuth token expired", "session timeout"

# With filters
trekker semantic-search "performance problems" --type task --status todo

# Hybrid mode (default) - combines keyword + semantic
trekker search "authentication" --mode hybrid

# Pure semantic (no keyword matching)
trekker search "authentication" --mode semantic
```

### Updated Search Options

```typescript
interface SearchOptions {
  types?: SearchEntityType[];
  status?: string;
  limit?: number;
  page?: number;
  mode?: 'keyword' | 'semantic' | 'hybrid';  // NEW
  threshold?: number;  // NEW: similarity threshold (0-1)
}
```

### Hybrid Scoring Formula

```
final_score = (alpha * fts5_score) + ((1 - alpha) * cosine_similarity)
```

Where `alpha = 0.3` by default (favors semantic similarity).

### New Service: `src/services/semantic-search.ts`

```typescript
export interface SemanticSearchResult {
  type: SearchEntityType;
  id: string;
  title: string;
  similarity: number;  // 0-1 cosine similarity
  status: string | null;
}

export async function semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResult[]> {
  const queryEmbedding = await embeddingService.embed(query);

  // sqlite-vec query
  const results = sqlite.query(`
    SELECT entity_id, entity_type,
           vec_distance_cosine(embedding, ?) as distance
    FROM embeddings
    ORDER BY distance ASC
    LIMIT ?
  `).all(queryEmbedding, options?.limit ?? 10);

  return results.map(r => ({
    ...r,
    similarity: 1 - r.distance  // Convert distance to similarity
  }));
}
```

## Indexing & Sync Strategy

### When Embeddings Are Generated

| Event | Action |
|-------|--------|
| `trekker init` | No embeddings yet (lazy) |
| First semantic search | Index all existing entities |
| Task/epic create | Embed new entity async |
| Task/epic update | Re-embed if title/description changed |
| Task/epic delete | Remove from embeddings table |

### Sync Mechanism

Unlike FTS5 which uses SQLite triggers, embeddings require async JavaScript:

```typescript
// In task service after create/update
export async function createTask(data: TaskInput): Promise<Task> {
  const task = await db.insert(tasks).values(data).returning();

  // Queue embedding (non-blocking)
  embeddingQueue.add({
    entityId: task.id,
    entityType: 'task',
    text: `${task.title} ${task.description ?? ''}`
  });

  return task;
}
```

### Reindex Command

```bash
# Rebuild all embeddings (e.g., after model upgrade)
trekker reindex --embeddings

# Check embedding status
trekker status
# → Tasks: 45 indexed, 2 pending
# → Model: embeddinggemma-300m (v1.0)
```

## Claude Code Plugin Integration

### New MCP Tools

**File: `trekker-claude-code/mcp-server/src/tools/search.ts`**

```typescript
export function registerSearchTools(server: McpServer): void {

  // Semantic search tool
  server.registerTool('trekker_semantic_search', {
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
        type: { type: 'string', enum: ['task', 'epic', 'subtask', 'comment'] },
        status: { type: 'string' },
        limit: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  }, async (args) => {
    return runTrekker(['semantic-search', args.query, '--toon', ...buildFlags(args)]);
  });

  // Find similar/duplicate tasks
  server.registerTool('trekker_find_similar', {
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID to find similar items for' },
        threshold: { type: 'number', default: 0.8, description: 'Similarity threshold 0-1' }
      },
      required: ['taskId']
    }
  }, async (args) => {
    return runTrekker(['similar', args.taskId, '--threshold', args.threshold, '--toon']);
  });
}
```

### Updated Plugin Registration

```typescript
// mcp-server/src/index.ts
import { registerSearchTools } from './tools/search.js';

// ... existing registrations ...
registerSearchTools(server);  // NEW
```

## Skills

### Skill 1: semantic-search

**File: `skills/semantic-search/semantic-search.md`**

```markdown
name: semantic-search
description: Find tasks, epics, and comments by meaning - not just keywords. Use when exact search terms are unknown or when exploring related work.

## When to Use This Skill

**ALWAYS use semantic search when:**
- You don't know the exact terminology used in existing tasks
- Investigating a bug or issue to find related past work
- Looking for tasks about a concept (e.g., "performance" finds "slow", "latency", "optimization")
- User describes a problem in natural language
- Checking if similar work was done before

**Examples of queries that benefit from semantic search:**
| User Says | Semantic Search Finds |
|-----------|----------------------|
| "login problems" | "authentication bug", "OAuth token expired", "session handling" |
| "app is slow" | "performance optimization", "database query latency", "caching" |
| "data not saving" | "persistence layer bug", "write failure", "transaction rollback" |
| "UI looks broken" | "CSS regression", "layout issue", "responsive design bug" |

## Commands

# Basic semantic search
trekker semantic-search "user cannot access their account"

# Filter by entity type
trekker semantic-search "deployment issues" --type task

# Filter by status (find unresolved related work)
trekker semantic-search "memory leak" --status todo,in_progress

# Hybrid search (combines keyword + semantic)
trekker search "authentication" --mode hybrid

# Adjust similarity threshold (default 0.5)
trekker semantic-search "caching" --threshold 0.7

## Workflow: Before Creating a Task

1. User wants to create a task
2. Run: trekker semantic-search "<description>"
3. If similar found → Review match, add comment or update existing
4. If no duplicate → Create new task

## Output Interpretation

Results for: "user cannot log in"

TREK-45  [0.89] Authentication fails after password reset
TREK-23  [0.76] OAuth token refresh not working
TREK-12  [0.71] Session expires too quickly
EPIC-3   [0.65] User Authentication Overhaul

Score meaning:
  0.90+ : Almost certainly the same issue
  0.75-0.89 : Highly related, review carefully
  0.60-0.74 : Possibly related, worth checking
  <0.60 : Tangentially related
```

### Skill 2: find-duplicates

**File: `skills/find-duplicates/find-duplicates.md`**

```markdown
name: find-duplicates
description: Detect duplicate or near-duplicate tasks to prevent redundant work. Use before creating tasks and during backlog grooming.

## When to Use This Skill

**MUST use when:**
- About to create a new task
- User reports an issue that "sounds familiar"
- Grooming backlog to consolidate work
- Merging related tasks into one

**Indicators you need this:**
- "I think we had something like this before"
- "This sounds similar to..."
- "Didn't we already track this?"
- Creating a task with generic terms (auth, bug, fix, update)

## Commands

# Find tasks similar to a specific task
trekker similar TREK-45
# → Shows tasks with >80% similarity

# Adjust threshold for broader matches
trekker similar TREK-45 --threshold 0.6

# Find duplicates for text (before creating)
trekker find-duplicates "Add user profile picture upload"

# Scan entire backlog for duplicate clusters
trekker duplicates --scan

## Duplicate Detection Workflow

# Step 1: User wants to create task
USER: "Create a task for fixing the login timeout bug"

# Step 2: Check for duplicates FIRST
trekker find-duplicates "fixing login timeout bug"

# Step 3: Decision
# If duplicate matches → add comment, don't create new task
# If different issue → create new task with reference

## Handling Duplicates

**Option A: Exact duplicate → Add context to existing**
trekker comment add TREK-34 -a "agent" -c "User reported same issue again."
trekker task update TREK-34 -p 1  # Bump priority if needed

**Option B: Related but distinct → Create with reference**
trekker task create -t "Timeout on MFA step" -d "Similar to TREK-34 but specific to MFA."
trekker dep add TREK-56 TREK-34

**Option C: Consolidate multiple duplicates**
trekker task update TREK-12 -s wont_fix -d "Consolidated into TREK-34"
trekker comment add TREK-34 -a "agent" -c "Consolidated TREK-12 into this task"

## Similarity Score Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 0.95+ | Near-identical | Do NOT create. Update existing. |
| 0.85-0.94 | Very similar | Review existing task carefully |
| 0.70-0.84 | Related work | May be distinct. Create with reference. |
| 0.50-0.69 | Loosely related | Probably different. Create new. |
| <0.50 | Different | Safe to create new task |
```

### Skill 3: smart-query

**File: `skills/smart-query/smart-query.md`**

```markdown
name: smart-query
description: Query tasks using natural language. Translates human questions into task searches.

## When to Use This Skill

**Use when the user asks questions like:**
- "What's blocking the release?"
- "What did we work on last week?"
- "Are there any urgent bugs?"
- "What tasks are stuck?"
- "Show me everything about payments"

## Natural Language Query Examples

| Natural Language | Trekker Command |
|-----------------|-----------------|
| "What's in progress?" | trekker task list --status in_progress |
| "Anything stuck or blocked?" | trekker semantic-search "blocked stuck waiting" |
| "Urgent bugs" | trekker semantic-search "bug" --status todo --priority 0,1 |
| "What did we finish recently?" | trekker task list --status completed --limit 10 |
| "Everything about authentication" | trekker semantic-search "authentication" |
| "Tasks without an epic" | trekker task list --no-epic |
| "What depends on TREK-5?" | trekker dep list TREK-5 --reverse |

## Query Patterns

**Status-based queries:**
# "What needs to be done?"
trekker task list --status todo

# "What are we actively working on?"
trekker task list --status in_progress

# "What got finished?"
trekker task list --status completed --limit 20

**Priority-based queries:**
# "What's urgent?"
trekker list --priority 0,1 --status todo

# "What can wait?"
trekker list --priority 4,5 --status todo

**Concept-based queries (semantic):**
# "Anything about performance?"
trekker semantic-search "performance speed optimization latency"

# "Security-related tasks"
trekker semantic-search "security vulnerability auth permissions"

**Relationship queries:**
# "What's blocking TREK-10?"
trekker dep list TREK-10

# "What does TREK-10 block?"
trekker dep list TREK-10 --reverse

# "All tasks in the Auth epic"
trekker task list --epic EPIC-2

## Response Format

When answering natural language queries, structure the response:

## Query: "What's blocking the release?"

Found 3 potentially blocking items:

**Critical (P0-P1):**
- TREK-45: Payment processing fails on retry [in_progress]
- TREK-52: Security patch for CVE-2024-XXX [todo]

**High (P2):**
- TREK-38: Update API documentation [todo]

**Blocked tasks:**
- TREK-50 blocked by TREK-45
- TREK-51 blocked by TREK-52
```

## Dependencies

### New npm packages for Trekker CLI

```json
{
  "dependencies": {
    "@anthropic-ai/transformers": "^3.x",  // or @huggingface/transformers
    "sqlite-vec": "^0.1.x"
  }
}
```

### Bun Compatibility Notes

- Transformers.js works with Bun via ONNX runtime
- sqlite-vec has Bun bindings available
- Model download uses native fetch (Bun-compatible)

## Implementation Tasks

1. **Core Infrastructure**
   - Add sqlite-vec extension loading
   - Create embeddings table and migration
   - Implement EmbeddingService with lazy loading

2. **Search Implementation**
   - Add semantic-search command
   - Add similar command
   - Update existing search with --mode flag
   - Implement hybrid scoring

3. **Indexing**
   - Hook embedding generation into task/epic services
   - Implement reindex command
   - Add embedding-sync for startup hook

4. **Claude Code Plugin**
   - Add trekker_semantic_search MCP tool
   - Add trekker_find_similar MCP tool
   - Create skill files

5. **Testing**
   - Unit tests for EmbeddingService
   - Integration tests for semantic search
   - Performance benchmarks

## Sources

- [EmbeddingGemma](https://developers.googleblog.com/introducing-embeddinggemma/) - Google's on-device embedding model
- [Transformers.js](https://huggingface.co/Xenova/all-MiniLM-L6-v2) - Run models in JS
- [sqlite-vec](https://github.com/asg017/sqlite-vec) - Vector search SQLite extension
- [Hugging Face ONNX Models](https://huggingface.co/onnx-community/embeddinggemma-300m-ONNX)
