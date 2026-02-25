import { eq, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { comments, tasks } from '../db/schema';
import { generateId } from '../utils/id-generator';
import type { Comment, CreateCommentInput, UpdateCommentInput, PaginatedResponse } from '../types';
import { PAGINATION_DEFAULTS } from '../types';

export function createComment(input: CreateCommentInput): Comment {
  const db = getDb();

  // Validate task exists
  const task = db.select().from(tasks).where(eq(tasks.id, input.taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${input.taskId}`);
  }

  const id = generateId('comment');
  const now = new Date();

  const comment = {
    id,
    taskId: input.taskId,
    author: input.author,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(comments).values(comment).run();

  return comment;
}

function getComment(id: string): Comment | undefined {
  const db = getDb();
  return db.select().from(comments).where(eq(comments.id, id)).get();
}

export function listComments(
  taskId: string,
  options?: {
    limit?: number;
    page?: number;
  }
): PaginatedResponse<Comment> {
  const db = getDb();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  // Validate task exists
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const where = eq(comments.taskId, taskId);

  const countRow = db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(where)
    .get();
  const total = countRow?.count ?? 0;

  const items = db
    .select()
    .from(comments)
    .where(where)
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return { total, page, limit, items };
}

export function updateComment(id: string, input: UpdateCommentInput): Comment {
  const db = getDb();

  const existing = getComment(id);
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  db.update(comments)
    .set({
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id))
    .run();

  const updated = getComment(id);
  if (!updated) {
    throw new Error(`Comment not found after update: ${id}`);
  }
  return updated;
}

export function deleteComment(id: string): void {
  const db = getDb();

  const existing = getComment(id);
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  db.delete(comments).where(eq(comments.id, id)).run();
}
