import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { tasks, projects, epics } from '../db/schema';
import { generateId } from '../utils/id-generator';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  PaginatedResponse,
} from '../types';
import { DEFAULT_PRIORITY, DEFAULT_TASK_STATUS, PAGINATION_DEFAULTS } from '../types';

export function createTask(input: CreateTaskInput): Task {
  const db = getDb();

  const project = db.select().from(projects).get();
  if (!project) {
    throw new Error("Project not found. Run 'trekker init' first.");
  }

  // Validate epic exists if provided
  if (input.epicId) {
    const epic = db.select().from(epics).where(eq(epics.id, input.epicId)).get();
    if (!epic) {
      throw new Error(`Epic not found: ${input.epicId}`);
    }
  }

  // Validate parent task exists if provided
  if (input.parentTaskId) {
    const parent = db.select().from(tasks).where(eq(tasks.id, input.parentTaskId)).get();
    if (!parent) {
      throw new Error(`Parent task not found: ${input.parentTaskId}`);
    }
  }

  const id = generateId('task');
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

  db.insert(tasks).values(task).run();

  return task;
}

export function getTask(id: string): Task | undefined {
  const db = getDb();
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}

export function listTasks(options?: {
  status?: TaskStatus;
  epicId?: string;
  parentTaskId?: string | null;
  limit?: number;
  page?: number;
}): PaginatedResponse<Task> {
  const db = getDb();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

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

  let where;
  if (conditions.length > 0) {
    where = and(...conditions);
  }

  const countRow = db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(where)
    .get();
  const total = countRow?.count ?? 0;

  const items = db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return { total, page, limit, items };
}

export function listSubtasks(
  parentTaskId: string,
  options?: {
    limit?: number;
    page?: number;
  }
): PaginatedResponse<Task> {
  const db = getDb();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  const where = eq(tasks.parentTaskId, parentTaskId);

  const countRow = db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(where)
    .get();
  const total = countRow?.count ?? 0;

  const items = db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return { total, page, limit, items };
}

export function updateTask(id: string, input: UpdateTaskInput): Task {
  const db = getDb();

  const existing = getTask(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  // Validate epic exists if provided
  if (input.epicId) {
    const epic = db.select().from(epics).where(eq(epics.id, input.epicId)).get();
    if (!epic) {
      throw new Error(`Epic not found: ${input.epicId}`);
    }
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.description !== undefined) {
    updates.description = input.description;
  }
  if (input.priority !== undefined) {
    updates.priority = input.priority;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.tags !== undefined) {
    updates.tags = input.tags;
  }
  if (input.epicId !== undefined) {
    updates.epicId = input.epicId;
  }

  db.update(tasks).set(updates).where(eq(tasks.id, id)).run();

  const updated = getTask(id);
  if (!updated) {
    throw new Error(`Task not found after update: ${id}`);
  }
  return updated;
}

export function deleteTask(id: string): void {
  const db = getDb();

  const existing = getTask(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  // Note: Subtasks and comments will be cascade deleted by SQLite
  db.delete(tasks).where(eq(tasks.id, id)).run();
}
