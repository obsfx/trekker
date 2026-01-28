import { eq } from "drizzle-orm";
import { getDb } from "../db/client-node";
import { comments, tasks } from "../db/schema";
import { generateId } from "../utils/id-generator";
import type { Comment, CreateCommentInput, UpdateCommentInput } from "../types";
import { indexEntity, removeEntityIndex } from "./semantic-search";
import { queueBackgroundTask } from "../utils/async";

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const db = await getDb();

  // Validate task exists
  const task = await db.select().from(tasks).where(eq(tasks.id, input.taskId)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!task || task.id === undefined) {
    throw new Error(`Task not found: ${input.taskId}`);
  }

  const id = generateId("comment");
  const now = new Date();

  const comment = {
    id,
    taskId: input.taskId,
    author: input.author,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(comments).values(comment);

  // Queue embedding generation (non-blocking)
  queueBackgroundTask(
    indexEntity(id, "comment", comment.content),
    `index ${id}`
  );

  return comment as Comment;
}

export async function getComment(id: string): Promise<Comment | undefined> {
  const db = await getDb();
  const result = await db.select().from(comments).where(eq(comments.id, id)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!result || result.id === undefined) {
    return undefined;
  }
  return result as Comment;
}

export async function listComments(taskId: string): Promise<Comment[]> {
  const db = await getDb();

  // Validate task exists
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!task || task.id === undefined) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return await db
    .select()
    .from(comments)
    .where(eq(comments.taskId, taskId))
    .all() as Comment[];
}

export async function updateComment(id: string, input: UpdateCommentInput): Promise<Comment> {
  const db = await getDb();

  const existing = await getComment(id);
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  await db.update(comments)
    .set({
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id));

  // Re-embed comment content (non-blocking)
  const updated = (await getComment(id))!;
  queueBackgroundTask(
    indexEntity(id, "comment", updated.content),
    `reindex ${id}`
  );

  return (await getComment(id))!;
}

export async function deleteComment(id: string): Promise<void> {
  const db = await getDb();

  const existing = await getComment(id);
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  // Remove from semantic index (non-blocking)
  queueBackgroundTask(removeEntityIndex(id), `remove index ${id}`);

  await db.delete(comments).where(eq(comments.id, id));
}
