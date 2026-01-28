import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { epics, projects, tasks } from "../db/schema";
import { generateId } from "../utils/id-generator";
import type {
  Epic,
  CreateEpicInput,
  UpdateEpicInput,
  EpicStatus,
} from "../types";
import {
  DEFAULT_PRIORITY,
  DEFAULT_EPIC_STATUS,
} from "../types";
import { indexEntity, removeEntityIndex } from "./semantic-search";

export function createEpic(input: CreateEpicInput): Epic {
  const db = getDb();

  const project = db.select().from(projects).get();
  if (!project) {
    throw new Error("Project not found. Run 'trekker init' first.");
  }

  const id = generateId("epic");
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

  // Queue embedding generation (non-blocking)
  indexEntity(id, "epic", `${epic.title} ${epic.description ?? ""}`).catch(
    () => {}
  );

  return epic as Epic;
}

export function getEpic(id: string): Epic | undefined {
  const db = getDb();
  const result = db.select().from(epics).where(eq(epics.id, id)).get();
  return result as Epic | undefined;
}

export function listEpics(status?: EpicStatus): Epic[] {
  const db = getDb();

  if (status) {
    return db
      .select()
      .from(epics)
      .where(eq(epics.status, status))
      .all() as Epic[];
  }

  return db.select().from(epics).all() as Epic[];
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

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;
  if (input.priority !== undefined) updates.priority = input.priority;

  db.update(epics).set(updates).where(eq(epics.id, id)).run();

  // Re-embed if title or description changed (non-blocking)
  if (input.title !== undefined || input.description !== undefined) {
    const updated = getEpic(id)!;
    indexEntity(
      id,
      "epic",
      `${updated.title} ${updated.description ?? ""}`
    ).catch(() => {});
  }

  return getEpic(id)!;
}

export function deleteEpic(id: string): void {
  const db = getDb();

  const existing = getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
  }

  // Remove from semantic index before deleting
  try {
    removeEntityIndex(id);
  } catch {
    // Ignore if semantic search not available
  }

  db.delete(epics).where(eq(epics.id, id)).run();
}

export interface CompleteEpicResult {
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

  if (existing.status === "completed") {
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
      const subtasks = db
        .select()
        .from(tasks)
        .where(eq(tasks.parentTaskId, taskId))
        .all();

      subtaskCount += subtasks.length;

      // Archive subtasks
      if (subtasks.length > 0) {
        db.update(tasks)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(tasks.parentTaskId, taskId))
          .run();
      }
    }

    // Archive tasks
    db.update(tasks)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
      .run();
  }

  // Complete the epic
  db.update(epics)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(epics.id, id))
    .run();

  return {
    epic: id,
    status: "completed",
    archived: {
      tasks: taskIds.length,
      subtasks: subtaskCount,
    },
  };
}
