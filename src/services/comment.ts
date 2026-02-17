import { eq } from "drizzle-orm";
import { getDbForEntity, parseDbFromId } from "../db/client";
import { comments, tasks } from "../db/schema";
import { generateId } from "../utils/id-generator";
import type { Comment, CreateCommentInput, UpdateCommentInput } from "../types";

export function createComment(input: CreateCommentInput): Comment {
  // Comment is stored in the same DB as the task it belongs to
  const taskDbName = parseDbFromId(input.taskId);
  const db = getDbForEntity(input.taskId);

  // Validate task exists
  const task = db.select().from(tasks).where(eq(tasks.id, input.taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${input.taskId}`);
  }

  const id = generateId("comment", taskDbName);
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

  return comment as Comment;
}

export function getComment(id: string): Comment | undefined {
  const db = getDbForEntity(id);
  const result = db.select().from(comments).where(eq(comments.id, id)).get();
  return result as Comment | undefined;
}

export function listComments(taskId: string): Comment[] {
  const db = getDbForEntity(taskId);

  // Validate task exists
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return db
    .select()
    .from(comments)
    .where(eq(comments.taskId, taskId))
    .all() as Comment[];
}

export function updateComment(id: string, input: UpdateCommentInput): Comment {
  const db = getDbForEntity(id);

  const existing = db.select().from(comments).where(eq(comments.id, id)).get() as Comment | undefined;
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

  return db.select().from(comments).where(eq(comments.id, id)).get() as Comment;
}

export function deleteComment(id: string): void {
  const db = getDbForEntity(id);

  const existing = db.select().from(comments).where(eq(comments.id, id)).get();
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  db.delete(comments).where(eq(comments.id, id)).run();
}
