import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { comments, tasks } from "../db/schema";
import { generateId } from "../utils/id-generator";
import type { Comment, CreateCommentInput, UpdateCommentInput } from "../types";
import { indexEntity, removeEntityIndex } from "./semantic-search";

export function createComment(input: CreateCommentInput): Comment {
  const db = getDb();

  // Validate task exists
  const task = db.select().from(tasks).where(eq(tasks.id, input.taskId)).get();
  if (!task) {
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

  db.insert(comments).values(comment).run();

  // Queue embedding generation (non-blocking)
  indexEntity(id, "comment", comment.content).catch(() => {});

  return comment as Comment;
}

export function getComment(id: string): Comment | undefined {
  const db = getDb();
  const result = db.select().from(comments).where(eq(comments.id, id)).get();
  return result as Comment | undefined;
}

export function listComments(taskId: string): Comment[] {
  const db = getDb();

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

  // Re-embed comment content (non-blocking)
  const updated = getComment(id)!;
  indexEntity(id, "comment", updated.content).catch(() => {});

  return getComment(id)!;
}

export function deleteComment(id: string): void {
  const db = getDb();

  const existing = getComment(id);
  if (!existing) {
    throw new Error(`Comment not found: ${id}`);
  }

  // Remove from semantic index before deleting
  try {
    removeEntityIndex(id);
  } catch {
    // Ignore if semantic search not available
  }

  db.delete(comments).where(eq(comments.id, id)).run();
}
