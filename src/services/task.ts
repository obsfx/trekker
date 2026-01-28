import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "../db/client-node";
import { tasks, projects, epics } from "../db/schema";
import { generateId } from "../utils/id-generator";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
} from "../types";
import {
  DEFAULT_PRIORITY,
  DEFAULT_TASK_STATUS,
} from "../types";
import { indexEntity, removeEntityIndex } from "./semantic-search";
import { queueBackgroundTask } from "../utils/async";

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDb();

  const project = await db.select().from(projects).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!project || project.id === undefined) {
    throw new Error("Project not found. Run 'trekker init' first.");
  }

  // Validate epic exists if provided
  if (input.epicId) {
    const epic = await db.select().from(epics).where(eq(epics.id, input.epicId)).get();
    // Workaround for drizzle-orm sqlite-proxy bug
    if (!epic || epic.id === undefined) {
      throw new Error(`Epic not found: ${input.epicId}`);
    }
  }

  // Validate parent task exists if provided
  if (input.parentTaskId) {
    const parent = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, input.parentTaskId))
      .get();
    // Workaround for drizzle-orm sqlite-proxy bug
    if (!parent || parent.id === undefined) {
      throw new Error(`Parent task not found: ${input.parentTaskId}`);
    }
  }

  const id = generateId("task");
  const now = new Date();

  const task = {
    id,
    projectId: project.id,
    epicId: input.epicId ?? null,
    parentTaskId: input.parentTaskId ?? null,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? DEFAULT_PRIORITY,
    status: input.status ?? DEFAULT_TASK_STATUS,
    tags: input.tags ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(tasks).values(task);

  // Queue embedding generation (non-blocking)
  const entityType = input.parentTaskId ? "subtask" : "task";
  queueBackgroundTask(
    indexEntity(id, entityType, `${task.title} ${task.description ?? ""}`),
    `index ${id}`
  );

  return task as Task;
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDb();
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!result || result.id === undefined) {
    return undefined;
  }
  return result as Task;
}

export async function listTasks(options?: {
  status?: TaskStatus;
  epicId?: string;
  parentTaskId?: string | null;
}): Promise<Task[]> {
  const db = await getDb();

  const conditions = [];

  if (options?.status) {
    conditions.push(eq(tasks.status, options.status));
  }

  if (options?.epicId) {
    conditions.push(eq(tasks.epicId, options.epicId));
  }

  // If parentTaskId is explicitly null, list only top-level tasks
  if (options?.parentTaskId === null) {
    conditions.push(isNull(tasks.parentTaskId));
  } else if (options?.parentTaskId) {
    conditions.push(eq(tasks.parentTaskId, options.parentTaskId));
  }

  if (conditions.length > 0) {
    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .all() as Task[];
  }

  return await db.select().from(tasks).all() as Task[];
}

export async function listSubtasks(parentTaskId: string): Promise<Task[]> {
  const db = await getDb();
  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId))
    .all() as Task[];
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const db = await getDb();

  const existing = await getTask(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  // Validate epic exists if provided
  if (input.epicId) {
    const epic = await db.select().from(epics).where(eq(epics.id, input.epicId)).get();
    if (!epic) {
      throw new Error(`Epic not found: ${input.epicId}`);
    }
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.status !== undefined) updates.status = input.status;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.epicId !== undefined) updates.epicId = input.epicId;

  await db.update(tasks).set(updates).where(eq(tasks.id, id));

  // Re-embed if title or description changed (non-blocking)
  if (input.title !== undefined || input.description !== undefined) {
    const updated = (await getTask(id))!;
    const entityType = updated.parentTaskId ? "subtask" : "task";
    queueBackgroundTask(
      indexEntity(id, entityType, `${updated.title} ${updated.description ?? ""}`),
      `reindex ${id}`
    );
  }

  return (await getTask(id))!;
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();

  const existing = await getTask(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  // Remove from semantic index (non-blocking)
  queueBackgroundTask(removeEntityIndex(id), `remove index ${id}`);

  // Note: Subtasks and comments will be cascade deleted by SQLite
  await db.delete(tasks).where(eq(tasks.id, id));
}
