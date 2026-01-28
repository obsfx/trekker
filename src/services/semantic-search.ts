import {
  requireSqliteInstance,
  isSqliteVecAvailable,
  upsertEmbedding,
  deleteEmbedding,
} from "../db/client";
import { embed, ensureModelLoaded } from "./embedding";
import { PAGINATION_DEFAULTS, type SearchEntityType } from "../types";

export type { SearchEntityType };

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
  mode: "semantic";
  results: SemanticSearchResult[];
}

interface EmbeddingSearchRow {
  entity_id: string;
  entity_type: string;
  distance: number;
}

interface EntityMetaRow {
  entity_id: string;
  entity_type: string;
  title: string | null;
  status: string | null;
  parent_id: string | null;
}

function requireSemanticSearch(): void {
  if (!isSqliteVecAvailable()) {
    throw new Error(
      "Semantic search is not available. Your SQLite build does not support dynamic extension loading."
    );
  }
}

/**
 * Perform semantic search using vector similarity.
 * Generates query embedding and finds similar entities using cosine distance.
 */
export async function semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResponse> {
  requireSemanticSearch();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const threshold = options?.threshold ?? 0.5;
  const offset = (page - 1) * limit;

  // Ensure model is loaded and generate query embedding
  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model for semantic search");
  }

  const queryEmbedding = await embed(query);
  const sqlite = requireSqliteInstance();

  // Build type filter condition
  let typeCondition = "";
  const typeParams: string[] = [];
  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => "?").join(", ");
    typeCondition = `AND e.entity_type IN (${placeholders})`;
    typeParams.push(...options.types);
  }

  // First, get all embeddings with distance, filtered by type
  // We use vec_distance_cosine which returns distance in range [0, 2]
  // 0 = identical, 2 = opposite
  // Convert distance to similarity: similarity = 1 - (distance / 2)
  const distanceThreshold = (1 - threshold) * 2;

  const searchQuery = `
    SELECT
      e.entity_id,
      e.entity_type,
      vec_distance_cosine(e.embedding, ?) as distance
    FROM embeddings e
    WHERE vec_distance_cosine(e.embedding, ?) <= ?
      ${typeCondition}
    ORDER BY distance ASC
  `;

  const searchParams = [
    queryEmbedding.buffer,
    queryEmbedding.buffer,
    distanceThreshold,
    ...typeParams,
  ];

  const embeddingResults = sqlite
    .query<EmbeddingSearchRow, unknown[]>(searchQuery)
    .all(...searchParams);

  // Now get metadata for each result and filter by status
  const results: SemanticSearchResult[] = [];

  for (const row of embeddingResults) {
    const meta = getEntityMeta(sqlite, row.entity_id, row.entity_type);
    if (!meta) continue;

    // Filter by status if specified
    if (options?.status && meta.status !== options.status) {
      continue;
    }

    // Convert distance to similarity (0-1 range where 1 is most similar)
    const similarity = 1 - row.distance / 2;

    results.push({
      type: row.entity_type as SearchEntityType,
      id: row.entity_id,
      title: meta.title,
      similarity,
      status: meta.status,
      parentId: meta.parent_id,
    });
  }

  // Apply pagination
  const total = results.length;
  const paginatedResults = results.slice(offset, offset + limit);

  return {
    query,
    total,
    page,
    limit,
    mode: "semantic",
    results: paginatedResults,
  };
}

/**
 * Get entity metadata (title, status, parentId) from the appropriate table.
 */
function getEntityMeta(
  sqlite: ReturnType<typeof requireSqliteInstance>,
  entityId: string,
  entityType: string
): EntityMetaRow | null {
  if (entityType === "epic") {
    const result = sqlite
      .query<{ title: string; status: string }, [string]>(
        "SELECT title, status FROM epics WHERE id = ?"
      )
      .get(entityId);

    if (!result) return null;
    return {
      entity_id: entityId,
      entity_type: entityType,
      title: result.title,
      status: result.status,
      parent_id: null,
    };
  }

  if (entityType === "task" || entityType === "subtask") {
    const result = sqlite
      .query<
        { title: string; status: string; parent_task_id: string | null; epic_id: string | null },
        [string]
      >("SELECT title, status, parent_task_id, epic_id FROM tasks WHERE id = ?")
      .get(entityId);

    if (!result) return null;
    return {
      entity_id: entityId,
      entity_type: entityType,
      title: result.title,
      status: result.status,
      parent_id: result.parent_task_id ?? result.epic_id,
    };
  }

  if (entityType === "comment") {
    const result = sqlite
      .query<{ content: string; task_id: string }, [string]>(
        "SELECT content, task_id FROM comments WHERE id = ?"
      )
      .get(entityId);

    if (!result) return null;
    return {
      entity_id: entityId,
      entity_type: entityType,
      title: result.content.length > 50 ? result.content.slice(0, 50) + "..." : result.content,
      status: null,
      parent_id: result.task_id,
    };
  }

  return null;
}

/**
 * Index an entity by generating and storing its embedding.
 * @param entityId The entity ID (e.g., TREK-1, EPIC-2)
 * @param entityType The type of entity (epic, task, subtask, comment)
 * @param text The text content to embed (title + description, or comment content)
 */
export async function indexEntity(
  entityId: string,
  entityType: SearchEntityType,
  text: string
): Promise<void> {
  requireSemanticSearch();

  if (!text || text.trim().length === 0) {
    return;
  }

  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model");
  }

  const embedding = await embed(text);
  upsertEmbedding(entityId, entityType, embedding);
}

/**
 * Remove an entity from the semantic search index.
 * @param entityId The entity ID to remove
 */
export function removeEntityIndex(entityId: string): void {
  requireSemanticSearch();
  deleteEmbedding(entityId);
}
