import { requireSqliteInstance, rebuildSearchIndex, getAllDbNames } from "../db/client";
import { getCurrentDbName, isDbExplicitlySet } from "../utils/db-context";
import { PAGINATION_DEFAULTS, type SearchEntityType } from "../types";

export type { SearchEntityType };

export interface SearchOptions {
  types?: SearchEntityType[];
  status?: string;
  limit?: number;
  page?: number;
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

function searchInDb(dbName: string, query: string, options?: SearchOptions): SearchResult[] {
  const sqlite = requireSqliteInstance(dbName);

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
  `;

  const results = sqlite.query(searchQuery).all(...params) as Array<{
    entity_id: string;
    entity_type: string;
    title: string | null;
    snippet: string;
    score: number;
    status: string | null;
    parent_id: string | null;
  }>;

  return results.map((row) => ({
    type: row.entity_type as SearchEntityType,
    id: row.entity_id,
    title: row.title,
    snippet: row.snippet,
    score: Math.abs(row.score),
    status: row.status || null,
    parentId: row.parent_id || null,
  }));
}

export function search(query: string, options?: SearchOptions): SearchResponse {
  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  let allResults: SearchResult[] = [];

  if (isDbExplicitlySet()) {
    allResults = searchInDb(getCurrentDbName(), query, options);
  } else {
    const allDbNames = getAllDbNames();
    for (const dbName of allDbNames) {
      allResults.push(...searchInDb(dbName, query, options));
    }
  }

  // Sort by score (lower BM25 = better match, we already used Math.abs)
  allResults.sort((a, b) => a.score - b.score);

  const total = allResults.length;
  const pageResults = allResults.slice(offset, offset + limit);

  return {
    query,
    total,
    page,
    limit,
    results: pageResults,
  };
}

export { rebuildSearchIndex };
