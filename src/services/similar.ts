import type { SQLQueryBindings } from "bun:sqlite";
import { requireSqliteInstance } from "../db/client";
import { embed, ensureModelLoaded } from "./embedding";
import { requireSemanticSearch, getEntityMeta } from "./semantic-search";
import { getTask } from "./task";
import { getEpic } from "./epic";

const ID_PATTERN = /^(TREK|EPIC)-\d+$/i;

export interface SimilarResult {
  id: string;
  type: string;
  title: string | null;
  similarity: number;
  status: string | null;
}

export interface SimilarResponse {
  sourceId?: string;
  sourceText?: string;
  threshold: number;
  results: SimilarResult[];
}

interface EmbeddingSearchRow {
  entity_id: string;
  entity_type: string;
  distance: number;
}

export interface FindSimilarOptions {
  threshold: number;
  limit: number;
  excludeId?: string;
}

/**
 * Find similar entities by embedding similarity.
 * @param searchText The text to search for
 * @param options Search options (threshold, limit, excludeId)
 */
export async function findSimilar(
  searchText: string,
  options: FindSimilarOptions
): Promise<SimilarResult[]> {
  requireSemanticSearch();

  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model for similarity search");
  }

  const queryEmbedding = await embed(searchText);
  const sqlite = requireSqliteInstance();

  // Convert similarity threshold to distance threshold
  // Cosine distance in range [0, 2], similarity = 1 - (distance / 2)
  const distanceThreshold = (1 - options.threshold) * 2;

  const searchQuery = `
    SELECT
      e.entity_id,
      e.entity_type,
      vec_distance_cosine(e.embedding, ?) as distance
    FROM embeddings e
    WHERE vec_distance_cosine(e.embedding, ?) <= ?
    ORDER BY distance ASC
    LIMIT ?
  `;

  // Request extra results to account for potential exclusion
  const fetchLimit = options.excludeId ? options.limit + 1 : options.limit;

  // Convert Float32Array buffer to Uint8Array for SQLite binding
  const embeddingBuffer = new Uint8Array(queryEmbedding.buffer);

  const embeddingResults = sqlite
    .query<EmbeddingSearchRow, SQLQueryBindings[]>(searchQuery)
    .all(embeddingBuffer, embeddingBuffer, distanceThreshold, fetchLimit);

  const results: SimilarResult[] = [];

  for (const row of embeddingResults) {
    // Skip the source item if searching by ID
    if (options.excludeId && row.entity_id.toUpperCase() === options.excludeId.toUpperCase()) {
      continue;
    }

    const meta = getEntityMeta(sqlite, row.entity_id, row.entity_type);
    if (!meta) continue;

    // Convert distance to similarity (0-1 range where 1 is most similar)
    const similarity = 1 - row.distance / 2;

    results.push({
      id: row.entity_id,
      type: row.entity_type,
      title: meta.title,
      similarity,
      status: meta.status,
    });

    // Stop once we have enough results
    if (results.length >= options.limit) {
      break;
    }
  }

  return results;
}

/**
 * Build search text from an entity ID.
 * @param idOrText The ID or text input
 * @returns Object with searchText and optional sourceId/sourceText
 */
export function resolveSearchInput(idOrText: string): {
  searchText: string;
  sourceId?: string;
  sourceText?: string;
} {
  if (ID_PATTERN.test(idOrText)) {
    const normalizedId = idOrText.toUpperCase();

    if (normalizedId.startsWith("TREK-")) {
      const task = getTask(normalizedId);
      if (!task) {
        throw new Error(`Task not found: ${normalizedId}`);
      }
      return {
        searchText: task.title + (task.description ? " " + task.description : ""),
        sourceId: normalizedId,
      };
    } else if (normalizedId.startsWith("EPIC-")) {
      const epic = getEpic(normalizedId);
      if (!epic) {
        throw new Error(`Epic not found: ${normalizedId}`);
      }
      return {
        searchText: epic.title + (epic.description ? " " + epic.description : ""),
        sourceId: normalizedId,
      };
    } else {
      throw new Error(`Unknown ID format: ${normalizedId}`);
    }
  }

  return {
    searchText: idOrText,
    sourceText: idOrText.length > 100 ? idOrText.slice(0, 100) + "..." : idOrText,
  };
}
