import { getDb, requireSqliteInstance } from "../db/client-node";
import { searchEmbeddings } from "../db/vectors";
import { embed, ensureModelLoaded } from "./embedding";
import { getEntityMeta } from "./semantic-search";
import { getTask } from "./task";
import { getEpic } from "./epic";
import { truncateText, buildEntityText } from "../utils/text";

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
  const loaded = await ensureModelLoaded({ silent: true });
  if (!loaded) {
    throw new Error("Failed to load embedding model for similarity search");
  }

  const queryEmbedding = await embed(searchText);

  // Request extra results to account for potential exclusion
  const fetchLimit = options.excludeId ? options.limit + 1 : options.limit;

  // Search embeddings using SQLite vectors
  const embeddingResults = await searchEmbeddings(queryEmbedding, {
    limit: fetchLimit,
    similarityThreshold: options.threshold,
  });

  // Initialize database and get SQLite instance for metadata lookup
  await getDb();
  const sqlite = requireSqliteInstance();

  const results: SimilarResult[] = [];

  for (const row of embeddingResults) {
    // Skip the source item if searching by ID
    if (options.excludeId && row.entityId.toUpperCase() === options.excludeId.toUpperCase()) {
      continue;
    }

    const meta = getEntityMeta(sqlite, row.entityId, row.entityType);
    if (!meta) continue;

    results.push({
      id: row.entityId,
      type: row.entityType,
      title: meta.title,
      similarity: row.similarity,
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
export async function resolveSearchInput(idOrText: string): Promise<{
  searchText: string;
  sourceId?: string;
  sourceText?: string;
}> {
  if (!ID_PATTERN.test(idOrText)) {
    return {
      searchText: idOrText,
      sourceText: truncateText(idOrText, 100),
    };
  }

  const normalizedId = idOrText.toUpperCase();

  if (normalizedId.startsWith("TREK-")) {
    const task = await getTask(normalizedId);
    if (!task) throw new Error(`Task not found: ${normalizedId}`);
    return { searchText: buildEntityText(task), sourceId: normalizedId };
  }

  if (normalizedId.startsWith("EPIC-")) {
    const epic = await getEpic(normalizedId);
    if (!epic) throw new Error(`Epic not found: ${normalizedId}`);
    return { searchText: buildEntityText(epic), sourceId: normalizedId };
  }

  throw new Error(`Unknown ID format: ${normalizedId}`);
}
