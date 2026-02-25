import { requireSqliteInstance, rebuildSearchIndex } from '../db/client';
import { PAGINATION_DEFAULTS } from '../types';
import type { SearchEntityType } from '../types';

interface SearchOptions {
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

interface SearchCountRow {
  total: number;
}

interface SearchRow {
  entity_id: string;
  entity_type: SearchEntityType;
  title: string | null;
  snippet: string;
  score: number;
  status: string | null;
  parent_id: string | null;
}

export function search(query: string, options?: SearchOptions): SearchResponse {
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['search_index MATCH ?'];
  const params: (string | number)[] = [query];

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => '?').join(', ');
    conditions.push(`entity_type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) as total
    FROM search_index
    WHERE ${whereClause}
  `;
  const countResult = sqlite.query<SearchCountRow, (string | number)[]>(countQuery).get(...params);
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

  const results = sqlite
    .query<SearchRow, (string | number)[]>(searchQuery)
    .all(...params, limit, offset);

  return {
    query,
    total,
    page,
    limit,
    results: results.map((row) => ({
      type: row.entity_type,
      id: row.entity_id,
      title: row.title,
      snippet: row.snippet,
      score: Math.abs(row.score),
      status: row.status ?? null,
      parentId: row.parent_id ?? null,
    })),
  };
}

export { rebuildSearchIndex };
