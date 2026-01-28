/**
 * Vector operations using SQLite storage and pure JavaScript cosine similarity.
 *
 * Replaces LanceDB with zero native dependencies.
 * For Trekker's scale (hundreds of entities), brute-force cosine similarity
 * is fast enough (~1-10ms for 1000 vectors).
 */
import { querySql, runSql, getSqliteInstance } from "./client-node";

const EMBEDDING_DIMENSION = 256;

interface EmbeddingRecord {
  entity_id: string;
  entity_type: string;
  vector: Uint8Array;
}

export interface EmbeddingSearchResult {
  entityId: string;
  entityType: string;
  similarity: number;
}

/**
 * Check if embeddings are disabled (for faster tests).
 */
function isEmbeddingsSkipped(): boolean {
  return process.env.TREKKER_SKIP_EMBEDDINGS === "1";
}

/**
 * Serialize Float32Array to Uint8Array for SQLite BLOB storage.
 */
function serializeVector(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer);
}

/**
 * Deserialize Uint8Array from SQLite BLOB to Float32Array.
 */
function deserializeVector(blob: Uint8Array): Float32Array {
  return new Float32Array(blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength));
}

/**
 * Compute cosine similarity between two vectors.
 * Both vectors should already be normalized, so this is just a dot product.
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Insert or update an embedding for an entity.
 */
export async function upsertEmbedding(
  entityId: string,
  entityType: string,
  embedding: Float32Array,
  _cwd: string = process.cwd()
): Promise<void> {
  if (isEmbeddingsSkipped()) return;

  const vectorBlob = serializeVector(embedding);

  // Use INSERT OR REPLACE to handle upsert
  runSql(
    `INSERT OR REPLACE INTO embeddings (entity_id, entity_type, vector) VALUES (?, ?, ?)`,
    [entityId, entityType, vectorBlob]
  );
}

/**
 * Delete an embedding for an entity.
 */
export async function deleteEmbedding(
  entityId: string,
  _cwd: string = process.cwd()
): Promise<void> {
  if (isEmbeddingsSkipped()) return;

  runSql(`DELETE FROM embeddings WHERE entity_id = ?`, [entityId]);
}

/**
 * Check if an embedding exists for an entity.
 */
export async function hasEmbedding(
  entityId: string,
  _cwd: string = process.cwd()
): Promise<boolean> {
  if (isEmbeddingsSkipped()) return false;

  const results = querySql<{ entity_id: string }>(
    `SELECT entity_id FROM embeddings WHERE entity_id = ? LIMIT 1`,
    [entityId]
  );
  return results.length > 0;
}

/**
 * Search for similar embeddings using cosine similarity.
 * Returns results sorted by similarity (descending).
 */
export async function searchEmbeddings(
  queryVector: Float32Array,
  options: {
    limit?: number;
    types?: string[];
    similarityThreshold?: number;
  } = {},
  _cwd: string = process.cwd()
): Promise<EmbeddingSearchResult[]> {
  if (isEmbeddingsSkipped()) return [];

  const limit = options.limit ?? 100;
  const similarityThreshold = options.similarityThreshold;

  // Build query with optional type filter
  let sql = `SELECT entity_id, entity_type, vector FROM embeddings`;
  const params: unknown[] = [];

  if (options.types && options.types.length > 0) {
    const placeholders = options.types.map(() => "?").join(", ");
    sql += ` WHERE entity_type IN (${placeholders})`;
    params.push(...options.types);
  }

  const records = querySql<EmbeddingRecord>(sql, params);

  // Compute similarities
  const results: EmbeddingSearchResult[] = records.map((record) => {
    const vector = deserializeVector(record.vector);
    const similarity = cosineSimilarity(queryVector, vector);
    return {
      entityId: record.entity_id,
      entityType: record.entity_type,
      similarity,
    };
  });

  // Filter by threshold if specified
  const filtered = similarityThreshold !== undefined
    ? results.filter((r) => r.similarity >= similarityThreshold)
    : results;

  // Sort by similarity (descending) and limit
  return filtered
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Get all embeddings (for reindexing).
 */
export async function getAllEmbeddings(
  _cwd: string = process.cwd()
): Promise<{ entity_id: string; entity_type: string }[]> {
  if (isEmbeddingsSkipped()) return [];

  return querySql<{ entity_id: string; entity_type: string }>(
    `SELECT entity_id, entity_type FROM embeddings`
  );
}

/**
 * Clear all embeddings (for reindexing).
 */
export async function clearAllEmbeddings(_cwd: string = process.cwd()): Promise<void> {
  if (isEmbeddingsSkipped()) return;

  runSql(`DELETE FROM embeddings`);
}

/**
 * Get the count of embeddings.
 */
export async function countEmbeddings(_cwd: string = process.cwd()): Promise<number> {
  if (isEmbeddingsSkipped()) return 0;

  const result = querySql<{ count: number }>(`SELECT COUNT(*) as count FROM embeddings`);
  return result[0]?.count ?? 0;
}

/**
 * Close vector database (no-op for SQLite-based storage).
 */
export function closeVectorDb(): void {
  // No-op - vectors are stored in SQLite, closed via closeDb()
}

/**
 * Check if vector storage is available (always true for SQLite).
 */
export function isVectorStorageAvailable(): boolean {
  return getSqliteInstance() !== null;
}

/**
 * Get the embedding dimension.
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
