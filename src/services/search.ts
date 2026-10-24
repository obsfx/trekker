import type { Database } from 'bun:sqlite';
import { DbClient } from '@/src/db/client';
import { SqlConditions } from '@/src/services/sql-conditions';
import { PAGINATION_DEFAULTS } from '@/src/types';
import type { SearchEntityType } from '@/src/types';

export abstract class SearchService {
  private static toLiteralTerms(query: string): string {
    return query
      .split(/\s+/)
      .filter((term) => {
        return term.length > 0;
      })
      .map((term) => {
        return `"${term.replaceAll('"', '""')}"`;
      })
      .join(' ');
  }

  private static resolveMatchQuery(sqlite: Database, query: string): string {
    try {
      sqlite.query('SELECT 1 FROM search_index WHERE search_index MATCH ? LIMIT 1').get(query);
      return query;
    } catch (error) {
      if (error instanceof Error && FTS_SYNTAX_ERROR.test(error.message)) {
        return SearchService.toLiteralTerms(query);
      }
      throw error;
    }
  }

  static search(query: string, options?: SearchOptions): SearchResponse {
    const sqlite = DbClient.requireSqliteInstance();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = options?.offset ?? (page - 1) * limit;

    const conditions = new SqlConditions()
      .add('search_index MATCH ?', SearchService.resolveMatchQuery(sqlite, query))
      .anyOf('entity_type', options?.types ?? [])
      .anyOf('status', options?.statuses ?? []);
    const whereClause = conditions.joined();
    const params = conditions.params;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM search_index
      WHERE ${whereClause}
    `;
    const countResult = sqlite
      .query<SearchCountRow, (string | number)[]>(countQuery)
      .get(...params);
    const total = countResult?.total ?? 0;

    const searchQuery = `
      SELECT
        entity_id,
        entity_type,
        title,
        NULLIF(snippet(search_index, 3, '**', '**', '...', 32), '') as snippet,
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
      results: results.map((row) => {
        return {
          type: row.entity_type,
          id: row.entity_id,
          title: row.title,
          snippet: row.snippet,
          score: Math.abs(row.score),
          status: row.status ?? null,
          parentId: row.parent_id ?? null,
        };
      }),
    };
  }
}

interface SearchOptions {
  types?: readonly SearchEntityType[];
  statuses?: readonly string[];
  limit?: number;
  page?: number;
  offset?: number;
}

export interface SearchResult {
  type: SearchEntityType;
  id: string;
  title: string | null;
  snippet: string | null;
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
  snippet: string | null;
  score: number;
  status: string | null;
  parent_id: string | null;
}

const FTS_SYNTAX_ERROR = /fts5|no such column|unknown special query|unterminated string/i;
