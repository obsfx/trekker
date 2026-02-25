import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { epics, projects, tasks } from '../db/schema';
import { generateId } from '../utils/id-generator';
import type {
  Epic,
  CreateEpicInput,
  UpdateEpicInput,
  EpicStatus,
  PaginatedResponse,
} from '../types';
import { DEFAULT_PRIORITY, DEFAULT_EPIC_STATUS, PAGINATION_DEFAULTS } from '../types';

export function createEpic(input: CreateEpicInput): Epic {
  const db = getDb();

  const project = db.select().from(projects).get();
  if (!project) {
    throw new Error("Project not found. Run 'trekker init' first.");
  }

  const id = generateId('epic');
  const now = new Date();

  const epic = {
    id,
    projectId: project.id,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? DEFAULT_EPIC_STATUS,
    priority: input.priority ?? DEFAULT_PRIORITY,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(epics).values(epic).run();

  return epic;
}

export function getEpic(id: string): Epic | undefined {
  const db = getDb();
  return db.select().from(epics).where(eq(epics.id, id)).get();
}

export function listEpics(options?: {
  status?: EpicStatus;
  limit?: number;
  page?: number;
}): PaginatedResponse<Epic> {
  const db = getDb();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  let where;
  if (options?.status) {
    where = eq(epics.status, options.status);
  }

  const countRow = db
    .select({ count: sql<number>`count(*)` })
    .from(epics)
    .where(where)
    .get();
  const total = countRow?.count ?? 0;

  const items = db
    .select()
    .from(epics)
    .where(where)
    .orderBy(desc(epics.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return { total, page, limit, items };
}

export function updateEpic(id: string, input: UpdateEpicInput): Epic {
  const db = getDb();

  const existing = getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
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
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.priority !== undefined) {
    updates.priority = input.priority;
  }

  db.update(epics).set(updates).where(eq(epics.id, id)).run();

  const updated = getEpic(id);
  if (!updated) {
    throw new Error(`Epic not found after update: ${id}`);
  }
  return updated;
}

export function deleteEpic(id: string): void {
  const db = getDb();

  const existing = getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
  }

  db.delete(epics).where(eq(epics.id, id)).run();
}

interface CompleteEpicResult {
  epic: string;
  status: string;
  archived: {
    tasks: number;
    subtasks: number;
  };
}

export function completeEpic(id: string): CompleteEpicResult {
  const db = getDb();

  const existing = getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
  }

  if (existing.status === 'completed') {
    throw new Error(`Epic is already completed: ${id}`);
  }

  // Get all tasks under this epic (not subtasks)
  const epicTasks = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
    .all();

  const taskIds = epicTasks.map((t) => t.id);

  // Get all subtasks of those tasks
  let subtaskCount = 0;
  if (taskIds.length > 0) {
    for (const taskId of taskIds) {
      const subtasks = db.select().from(tasks).where(eq(tasks.parentTaskId, taskId)).all();

      subtaskCount += subtasks.length;

      // Archive subtasks
      if (subtasks.length > 0) {
        db.update(tasks)
          .set({ status: 'archived', updatedAt: new Date() })
          .where(eq(tasks.parentTaskId, taskId))
          .run();
      }
    }

    // Archive tasks
    db.update(tasks)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
      .run();
  }

  // Complete the epic
  db.update(epics)
    .set({ status: 'completed', updatedAt: new Date() })
    .where(eq(epics.id, id))
    .run();

  return {
    epic: id,
    status: 'completed',
    archived: {
      tasks: taskIds.length,
      subtasks: subtaskCount,
    },
  };
}
