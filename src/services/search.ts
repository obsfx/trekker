import { requireSqliteInstance, rebuildSearchIndex, isSqliteVecAvailable } from "../db/client";
import { PAGINATION_DEFAULTS, type SearchEntityType } from "../types";
import { semanticSearch } from "./semantic-search";

export type { SearchEntityType };

export const SEARCH_MODES = ["keyword", "semantic", "hybrid"] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

export interface SearchOptions {
  types?: SearchEntityType[];
  status?: string;
  limit?: number;
  page?: number;
  mode?: SearchMode;
}

export interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  snippet: string;
  score: number;
  status: string | null;
  parentId: string | null;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: SearchResult[];
}

export function search(query: string, options?: SearchOptions): SearchResponse {
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["search_index MATCH ?"];
  const params: (string | number)[] = [query];

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => "?").join(", ");
    conditions.push(`entity_type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.status) {
    conditions.push("status = ?");
    params.push(options.status);
  }

  const whereClause = conditions.join(" AND ");

  const countQuery = `
    SELECT COUNT(*) as total
    FROM search_index
    WHERE ${whereClause}
  `;
  const countResult = sqlite.query(countQuery).get(...params) as { total: number };
  const total = countResult?.total ?? 0;

  const searchQuery = `
    SELECT
      entity_id,
      entity_type,
      title,
      snippet(search_index, 3, '**', '**', '...', 32) as snippet,
      bm25(search_index) as score,
      status,
      parent_id
    FROM search_index
    WHERE ${whereClause}
    ORDER BY bm25(search_index)
    LIMIT ? OFFSET ?
  `;

  const results = sqlite.query(searchQuery).all(...params, limit, offset) as Array<{
    entity_id: string;
    entity_type: string;
    title: string | null;
    snippet: string;
    score: number;
    status: string | null;
    parent_id: string | null;
  }>;

  return {
    query,
    total,
    page,
    limit,
    results: results.map((row) => ({
      type: row.entity_type as SearchEntityType,
      id: row.entity_id,
      title: row.title,
      snippet: row.snippet,
      score: Math.abs(row.score),
      status: row.status || null,
      parentId: row.parent_id || null,
    })),
  };
}

export { rebuildSearchIndex };

/**
 * Hybrid search result with combined score
 */
export interface HybridSearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  snippet: string;
  score: number;
  status: string | null;
  parentId: string | null;
  keywordScore?: number;
  semanticScore?: number;
}

export interface HybridSearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  mode: "hybrid";
  results: HybridSearchResult[];
}

/**
 * Hybrid search combining FTS5 keyword search with semantic similarity.
 *
 * Algorithm:
 * 1. Get keyword results (FTS5) with limit * 2
 * 2. Get semantic results with limit * 2, threshold 0.4
 * 3. Combine and dedupe by entity ID
 * 4. Calculate hybrid score: alpha * normalized_fts5 + (1 - alpha) * semantic
 * 5. Sort by hybrid score descending
 * 6. Apply pagination
 */
export async function hybridSearch(
  query: string,
  options?: SearchOptions
): Promise<HybridSearchResponse> {
  // Check for sqlite-vec availability early, before attempting any search
  if (!isSqliteVecAvailable()) {
    throw new Error(
      "Hybrid search requires semantic search, which is not available. Your SQLite build does not support dynamic extension loading."
    );
  }

  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;
  const expandedLimit = limit * 2;
  const alpha = 0.3; // Favor semantic (1 - 0.3 = 0.7 weight)

  // Get keyword results
  const keywordResults = search(query, {
    types: options?.types,
    status: options?.status,
    limit: expandedLimit,
    page: 1,
  });

  // Get semantic results
  const semanticResults = await semanticSearch(query, {
    types: options?.types,
    status: options?.status,
    limit: expandedLimit,
    page: 1,
    threshold: 0.4,
  });

  // Build a map of all unique entities with their scores
  const entityMap = new Map<
    string,
    {
      type: SearchEntityType;
      id: string;
      title: string | null;
      snippet: string;
      status: string | null;
      parentId: string | null;
      keywordScore?: number;
      semanticScore?: number;
    }
  >();

  // Normalize FTS5 scores (BM25 returns negative values, more negative = better match)
  // Convert to 0-1 range where 1 is best
  const maxFtsScore = keywordResults.results.length > 0
    ? Math.max(...keywordResults.results.map((r) => r.score))
    : 1;
  const minFtsScore = keywordResults.results.length > 0
    ? Math.min(...keywordResults.results.map((r) => r.score))
    : 0;
  const ftsRange = maxFtsScore - minFtsScore || 1;

  // Add keyword results
  for (const r of keywordResults.results) {
    // Normalize score to 0-1 (higher is better)
    const normalizedFts = maxFtsScore === minFtsScore
      ? 1
      : (r.score - minFtsScore) / ftsRange;

    entityMap.set(r.id, {
      type: r.type,
      id: r.id,
      title: r.title,
      snippet: r.snippet,
      status: r.status,
      parentId: r.parentId,
      keywordScore: normalizedFts,
    });
  }

  // Add semantic results, merging with existing keyword results
  for (const r of semanticResults.results) {
    const existing = entityMap.get(r.id);
    if (existing) {
      existing.semanticScore = r.similarity;
    } else {
      // Need to get snippet for semantic-only results
      const snippet = r.title || "";
      entityMap.set(r.id, {
        type: r.type,
        id: r.id,
        title: r.title,
        snippet,
        status: r.status,
        parentId: r.parentId,
        semanticScore: r.similarity,
      });
    }
  }

  // Calculate hybrid scores and sort
  const results: HybridSearchResult[] = [];
  for (const entity of entityMap.values()) {
    // For entities with only one type of score, the missing score defaults to 0.
    // This naturally penalizes entities that only appear in one search type.
    const keywordScore = entity.keywordScore ?? 0;
    const semanticScore = entity.semanticScore ?? 0;

    // Calculate hybrid score
    const hybridScore = alpha * keywordScore + (1 - alpha) * semanticScore;

    results.push({
      type: entity.type,
      id: entity.id,
      title: entity.title,
      snippet: entity.snippet,
      score: hybridScore,
      status: entity.status,
      parentId: entity.parentId,
      keywordScore,
      semanticScore,
    });
  }

  // Sort by hybrid score descending
  results.sort((a, b) => b.score - a.score);

  // Apply pagination
  const total = results.length;
  const paginatedResults = results.slice(offset, offset + limit);

  return {
    query,
    total,
    page,
    limit,
    mode: "hybrid",
    results: paginatedResults,
  };
}
