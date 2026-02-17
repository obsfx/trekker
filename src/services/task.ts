import { eq, and, isNull } from "drizzle-orm";
import { getDb, getDbForEntity, getAllDbNames } from "../db/client";
import { tasks, projects, epics, dependencies } from "../db/schema";
import { generateId } from "../utils/id-generator";
import { getCurrentDbName } from "../utils/db-context";
import { isDbExplicitlySet } from "../utils/db-context";
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

export function createTask(input: CreateTaskInput): Task {
  const dbName = getCurrentDbName();
  const db = getDb(dbName);

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
    const parentDb = getDbForEntity(input.parentTaskId);
    const parent = parentDb
      .select()
      .from(tasks)
      .where(eq(tasks.id, input.parentTaskId))
      .get();
    if (!parent) {
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

  db.insert(tasks).values(task).run();

  return task as Task;
}

export function getTask(id: string): Task | undefined {
  const db = getDbForEntity(id);
  const result = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return result as Task | undefined;
}

export function listTasks(options?: {
  status?: TaskStatus;
  epicId?: string;
  parentTaskId?: string | null;
}): Task[] {
  if (isDbExplicitlySet()) {
    return listTasksFromDb(getCurrentDbName(), options);
  }

  // Aggregate from all DBs
  const allDbNames = getAllDbNames();
  const allTasks: Task[] = [];
  for (const dbName of allDbNames) {
    allTasks.push(...listTasksFromDb(dbName, options));
  }
  return allTasks;
}

function listTasksFromDb(dbName: string, options?: {
  status?: TaskStatus;
  epicId?: string;
  parentTaskId?: string | null;
}): Task[] {
  const db = getDb(dbName);

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
    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .all() as Task[];
  }

  return db.select().from(tasks).all() as Task[];
}

export function listSubtasks(parentTaskId: string): Task[] {
  const db = getDbForEntity(parentTaskId);
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, parentTaskId))
    .all() as Task[];
}

export function updateTask(id: string, input: UpdateTaskInput): Task {
  const db = getDbForEntity(id);

  const existing = db.select().from(tasks).where(eq(tasks.id, id)).get() as Task | undefined;
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

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.status !== undefined) updates.status = input.status;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.epicId !== undefined) updates.epicId = input.epicId;

  db.update(tasks).set(updates).where(eq(tasks.id, id)).run();

  return db.select().from(tasks).where(eq(tasks.id, id)).get() as Task;
}

export function deleteTask(id: string): void {
  const db = getDbForEntity(id);

  const existing = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  // Clean up cross-DB dependency references
  cleanupCrossDbDeps(id);

  // Note: Subtasks and comments will be cascade deleted by SQLite
  db.delete(tasks).where(eq(tasks.id, id)).run();
}

/**
 * When a task is deleted, scan all DBs and remove any dependency rows
 * where depends_on_id matches the deleted task's ID.
 */
function cleanupCrossDbDeps(taskId: string): void {
  const allDbNames = getAllDbNames();

  for (const dbName of allDbNames) {
    const db = getDb(dbName);
    db.delete(dependencies)
      .where(eq(dependencies.dependsOnId, taskId))
      .run();
  }
}
