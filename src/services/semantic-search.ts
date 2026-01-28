import { getDb, requireSqliteInstance } from "../db/client-node";
import {
  searchEmbeddings,
  upsertEmbedding,
  deleteEmbedding,
  isVectorStorageAvailable,
} from "../db/vectors";
import { embed, ensureModelLoaded } from "./embedding";
import { PAGINATION_DEFAULTS, type SearchEntityType } from "../types";
import { truncateText } from "../utils/text";
import type { Database as SqlJsDatabase } from "sql.js";

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

interface EntityMetaRow {
  entity_id: string;
  entity_type: string;
  title: string | null;
  status: string | null;
  parent_id: string | null;
}

/**
 * Check if semantic search is available.
 */
export function isSemanticSearchAvailable(): boolean {
  return isVectorStorageAvailable();
}

/**
 * Perform semantic search using vector similarity.
 * Generates query embedding and finds similar entities using SQLite vectors.
 */
export async function semanticSearch(
  query: string,
  options?: SemanticSearchOptions
): Promise<SemanticSearchResponse> {
  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const threshold = options?.threshold ?? 0.5;
  const offset = (page - 1) * limit;

  // Initialize database first
  await getDb();
  const sqlite = requireSqliteInstance();

  // Ensure model is loaded and generate query embedding
  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model for semantic search");
  }

  const queryEmbedding = await embed(query);

  // Search embeddings using SQLite vectors
  const embeddingResults = await searchEmbeddings(queryEmbedding, {
    limit: limit * 10, // Fetch more to allow for filtering
    types: options?.types,
    similarityThreshold: threshold,
  });

  // Get metadata for each result and filter by status
  const results: SemanticSearchResult[] = [];

  for (const row of embeddingResults) {
    const meta = getEntityMeta(sqlite, row.entityId, row.entityType);
    if (!meta) continue;

    // Filter by status if specified
    if (options?.status && meta.status !== options.status) {
      continue;
    }

    results.push({
      type: row.entityType as SearchEntityType,
      id: row.entityId,
      title: meta.title,
      similarity: row.similarity,
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
export function getEntityMeta(
  sqlite: SqlJsDatabase,
  entityId: string,
  entityType: string
): EntityMetaRow | null {
  if (entityType === "epic") {
    const stmt = sqlite.prepare("SELECT title, status FROM epics WHERE id = ?");
    stmt.bind([entityId]);

    if (stmt.step()) {
      const row = stmt.getAsObject() as { title: string; status: string };
      stmt.free();
      return {
        entity_id: entityId,
        entity_type: entityType,
        title: row.title,
        status: row.status,
        parent_id: null,
      };
    }
    stmt.free();
    return null;
  }

  if (entityType === "task" || entityType === "subtask") {
    const stmt = sqlite.prepare(
      "SELECT title, status, parent_task_id, epic_id FROM tasks WHERE id = ?"
    );
    stmt.bind([entityId]);

    if (stmt.step()) {
      const row = stmt.getAsObject() as {
        title: string;
        status: string;
        parent_task_id: string | null;
        epic_id: string | null;
      };
      stmt.free();
      return {
        entity_id: entityId,
        entity_type: entityType,
        title: row.title,
        status: row.status,
        parent_id: row.parent_task_id ?? row.epic_id,
      };
    }
    stmt.free();
    return null;
  }

  if (entityType === "comment") {
    const stmt = sqlite.prepare("SELECT content, task_id FROM comments WHERE id = ?");
    stmt.bind([entityId]);

    if (stmt.step()) {
      const row = stmt.getAsObject() as { content: string; task_id: string };
      stmt.free();
      return {
        entity_id: entityId,
        entity_type: entityType,
        title: truncateText(row.content, 50),
        status: null,
        parent_id: row.task_id,
      };
    }
    stmt.free();
    return null;
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
  if (!text || text.trim().length === 0) {
    return;
  }

  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model");
  }

  const embedding = await embed(text);
  await upsertEmbedding(entityId, entityType, embedding);
}

/**
 * Remove an entity from the semantic search index.
 * @param entityId The entity ID to remove
 */
export async function removeEntityIndex(entityId: string): Promise<void> {
  await deleteEmbedding(entityId);
}
