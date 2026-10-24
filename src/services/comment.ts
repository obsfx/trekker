import dayjs from 'dayjs';
import { eq, desc, sql } from 'drizzle-orm';
import { DbClient } from '@/src/db/client';
import { comments } from '@/src/db/schema';
import { IdGenerator } from '@/src/utils/id-generator';
import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
  PaginatedResponse,
} from '@/src/types';
import { PAGINATION_DEFAULTS } from '@/src/types';
import { MS_PER_SECOND } from '@/src/utils/constants';
import type { PageQuery } from '@/src/types';
import { TaskService } from '@/src/services/task';

export abstract class CommentService {
  static createComment(input: CreateCommentInput): Comment {
    const db = DbClient.getDb();

    TaskService.requireTask(input.taskId);

    const id = IdGenerator.generateId('comment');
    const now = dayjs().toDate();

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

  private static getComment(id: string): Comment | undefined {
    const db = DbClient.getDb();
    return db.select().from(comments).where(eq(comments.id, id)).get();
  }

  static listComments(taskId: string, options?: PageQuery): PaginatedResponse<Comment> {
    const db = DbClient.getDb();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    TaskService.requireTask(taskId);

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

  static updateComment(id: string, input: UpdateCommentInput): Comment {
    const db = DbClient.getDb();

    const existing = CommentService.getComment(id);
    if (!existing) {
      throw new Error(`Comment not found: ${id}`);
    }

    db.update(comments)
      .set({
        content: input.content,
        updatedAt: dayjs().toDate(),
      })
      .where(eq(comments.id, id))
      .run();

    const updated = CommentService.getComment(id);
    if (!updated) {
      throw new Error(`Comment not found after update: ${id}`);
    }
    return updated;
  }

  static deleteComment(id: string): void {
    const db = DbClient.getDb();

    const existing = CommentService.getComment(id);
    if (!existing) {
      throw new Error(`Comment not found: ${id}`);
    }

    db.delete(comments).where(eq(comments.id, id)).run();
  }

  static listCommentPage(taskId: string, afterSequence: number | null, limit: number): CommentPage {
    TaskService.requireTask(taskId);

    const sqlite = DbClient.requireSqliteInstance();
    const total =
      sqlite
        .query<
          CommentCountRow,
          [string]
        >('SELECT COUNT(*) AS total FROM comments WHERE task_id = ?')
        .get(taskId)?.total ?? 0;
    const rows = sqlite
      .query<CommentRow, [string, number, number]>(
        `SELECT rowid AS sequence, id, task_id, author, content, created_at, updated_at
         FROM comments WHERE task_id = ? AND rowid > ? ORDER BY rowid LIMIT ?`
      )
      .all(taskId, afterSequence ?? 0, limit + 1);

    const pageRows = rows.slice(0, limit);
    let nextSequence: number | null = null;
    const last = pageRows.at(-1);
    if (rows.length > limit && last) {
      nextSequence = last.sequence;
    }

    return {
      items: pageRows.map((row) => {
        return {
          id: row.id,
          taskId: row.task_id,
          author: row.author,
          content: row.content,
          createdAt: dayjs(row.created_at * MS_PER_SECOND).toDate(),
          updatedAt: dayjs(row.updated_at * MS_PER_SECOND).toDate(),
        };
      }),
      total,
      nextSequence,
    };
  }
}

export interface CommentPage {
  items: Comment[];
  total: number;
  nextSequence: number | null;
}

interface CommentRow {
  sequence: number;
  id: string;
  task_id: string;
  author: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface CommentCountRow {
  total: number;
}
