import { getDb, requireSqliteInstance } from "../db/client-node";
import { PAGINATION_DEFAULTS, type SearchEntityType } from "../types";
import { semanticSearch } from "./semantic-search";

export type { SearchEntityType };

/**
 * Normalize a score to 0-1 range.
 * Returns 1 if range is 0 (all scores equal).
 */
function normalizeScore(score: number, min: number, range: number): number {
  if (range === 0) return 1;
  return (score - min) / range;
}

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

/**
 * Create a snippet from text highlighting the matched query.
 * Returns text around the first match with ** markers.
 */
function createSnippet(text: string | null, query: string, maxLength = 100): string {
  if (!text) return "";

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  }

  // Get context around the match
  const start = Math.max(0, matchIndex - 30);
  const end = Math.min(text.length, matchIndex + query.length + 30);

  let snippet = "";
  if (start > 0) snippet += "...";
  snippet += text.substring(start, matchIndex);
  snippet += "**" + text.substring(matchIndex, matchIndex + query.length) + "**";
  snippet += text.substring(matchIndex + query.length, end);
  if (end < text.length) snippet += "...";

  return snippet;
}

/**
 * Calculate a simple relevance score based on matches.
 * Higher score = more relevant (title match > description match).
 */
function calculateScore(
  title: string | null,
  content: string | null,
  query: string
): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  if (title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle === lowerQuery) {
      score += 100; // Exact title match
    } else if (lowerTitle.includes(lowerQuery)) {
      score += 50; // Partial title match
    }
  }

  if (content) {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes(lowerQuery)) {
      // Count occurrences
      const matches = lowerContent.split(lowerQuery).length - 1;
      score += Math.min(matches * 5, 25); // Up to 25 points for content matches
    }
  }

  return score;
}

export async function search(query: string, options?: SearchOptions): Promise<SearchResponse> {
  // Initialize database first (async with sql.js)
  await getDb();
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.SEARCH_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;
  const likePattern = `%${query}%`;

  // Determine which types to search
  const types = options?.types ?? ["epic", "task", "subtask", "comment"];

  interface RawResult {
    entity_id: string;
    entity_type: SearchEntityType;
    title: string | null;
    content: string | null;
    status: string | null;
    parent_id: string | null;
  }

  const allResults: RawResult[] = [];

  // Search epics
  if (types.includes("epic")) {
    const epicConditions = ["(title LIKE ? OR description LIKE ?)"];
    const epicParams: (string | number)[] = [likePattern, likePattern];

    if (options?.status) {
      epicConditions.push("status = ?");
      epicParams.push(options.status);
    }

    const epicSql = `
      SELECT id as entity_id, 'epic' as entity_type, title, description as content, status, NULL as parent_id
      FROM epics
      WHERE ${epicConditions.join(" AND ")}
    `;
    const stmt = sqlite.prepare(epicSql);
    stmt.bind(epicParams);
    while (stmt.step()) {
      allResults.push(stmt.getAsObject() as RawResult);
    }
    stmt.free();
  }

  // Search tasks (non-subtasks)
  if (types.includes("task")) {
    const taskConditions = ["parent_task_id IS NULL", "(title LIKE ? OR description LIKE ?)"];
    const taskParams: (string | number)[] = [likePattern, likePattern];

    if (options?.status) {
      taskConditions.push("status = ?");
      taskParams.push(options.status);
    }

    const taskSql = `
      SELECT id as entity_id, 'task' as entity_type, title, description as content, status, epic_id as parent_id
      FROM tasks
      WHERE ${taskConditions.join(" AND ")}
    `;
    const stmt = sqlite.prepare(taskSql);
    stmt.bind(taskParams);
    while (stmt.step()) {
      allResults.push(stmt.getAsObject() as RawResult);
    }
    stmt.free();
  }

  // Search subtasks
  if (types.includes("subtask")) {
    const subtaskConditions = ["parent_task_id IS NOT NULL", "(title LIKE ? OR description LIKE ?)"];
    const subtaskParams: (string | number)[] = [likePattern, likePattern];

    if (options?.status) {
      subtaskConditions.push("status = ?");
      subtaskParams.push(options.status);
    }

    const subtaskSql = `
      SELECT id as entity_id, 'subtask' as entity_type, title, description as content, status, parent_task_id as parent_id
      FROM tasks
      WHERE ${subtaskConditions.join(" AND ")}
    `;
    const stmt = sqlite.prepare(subtaskSql);
    stmt.bind(subtaskParams);
    while (stmt.step()) {
      allResults.push(stmt.getAsObject() as RawResult);
    }
    stmt.free();
  }

  // Search comments
  if (types.includes("comment")) {
    const commentConditions = ["content LIKE ?"];
    const commentParams: (string | number)[] = [likePattern];

    // Comments don't have status, so we skip status filter for comments

    const commentSql = `
      SELECT id as entity_id, 'comment' as entity_type, NULL as title, content, NULL as status, task_id as parent_id
      FROM comments
      WHERE ${commentConditions.join(" AND ")}
    `;
    const stmt = sqlite.prepare(commentSql);
    stmt.bind(commentParams);
    while (stmt.step()) {
      allResults.push(stmt.getAsObject() as RawResult);
    }
    stmt.free();
  }

  // Calculate scores and sort
  const scoredResults = allResults.map((r) => ({
    ...r,
    score: calculateScore(r.title, r.content, query),
    snippet: createSnippet(r.title || r.content, query),
  }));

  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);

  // Apply pagination
  const total = scoredResults.length;
  const paginatedResults = scoredResults.slice(offset, offset + limit);

  return {
    query,
    total,
    page,
    limit,
    results: paginatedResults.map((row) => ({
      type: row.entity_type,
      id: row.entity_id,
      title: row.title,
      snippet: row.snippet,
      score: row.score,
      status: row.status || null,
      parentId: row.parent_id || null,
    })),
  };
}

/**
 * Rebuild search index - no-op for LIKE-based search.
 * Kept for API compatibility.
 */
export function rebuildSearchIndex(): void {
  // No-op: LIKE-based search doesn't need a separate index
}

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

  // Normalize FTS5 scores to 0-1 range where 1 is best
  const scores = keywordResults.results.map((r) => r.score);
  const minFtsScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxFtsScore = scores.length > 0 ? Math.max(...scores) : 0;
  const ftsRange = maxFtsScore - minFtsScore;

  // Add keyword results
  for (const r of keywordResults.results) {
    const normalizedFts = normalizeScore(r.score, minFtsScore, ftsRange);

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
