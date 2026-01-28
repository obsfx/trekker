import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "../db/client-node";
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
import { queueBackgroundTask } from "../utils/async";

export async function createEpic(input: CreateEpicInput): Promise<Epic> {
  const db = await getDb();

  const project = await db.select().from(projects).get();
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

  await db.insert(epics).values(epic);

  // Queue embedding generation (non-blocking)
  queueBackgroundTask(
    indexEntity(id, "epic", `${epic.title} ${epic.description ?? ""}`),
    `index ${id}`
  );

  return epic as Epic;
}

export async function getEpic(id: string): Promise<Epic | undefined> {
  const db = await getDb();
  const result = await db.select().from(epics).where(eq(epics.id, id)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!result || result.id === undefined) {
    return undefined;
  }
  return result as Epic;
}

export async function listEpics(status?: EpicStatus): Promise<Epic[]> {
  const db = await getDb();

  if (status) {
    return await db
      .select()
      .from(epics)
      .where(eq(epics.status, status))
      .all() as Epic[];
  }

  return await db.select().from(epics).all() as Epic[];
}

export async function updateEpic(id: string, input: UpdateEpicInput): Promise<Epic> {
  const db = await getDb();

  const existing = await getEpic(id);
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

  await db.update(epics).set(updates).where(eq(epics.id, id));

  // Re-embed if title or description changed (non-blocking)
  if (input.title !== undefined || input.description !== undefined) {
    const updated = (await getEpic(id))!;
    queueBackgroundTask(
      indexEntity(id, "epic", `${updated.title} ${updated.description ?? ""}`),
      `reindex ${id}`
    );
  }

  return (await getEpic(id))!;
}

export async function deleteEpic(id: string): Promise<void> {
  const db = await getDb();

  const existing = await getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
  }

  // Remove from semantic index (non-blocking)
  queueBackgroundTask(removeEntityIndex(id), `remove index ${id}`);

  await db.delete(epics).where(eq(epics.id, id));
}

export interface CompleteEpicResult {
  epic: string;
  status: string;
  archived: {
    tasks: number;
    subtasks: number;
  };
}

export async function completeEpic(id: string): Promise<CompleteEpicResult> {
  const db = await getDb();

  const existing = await getEpic(id);
  if (!existing) {
    throw new Error(`Epic not found: ${id}`);
  }

  if (existing.status === "completed") {
    throw new Error(`Epic is already completed: ${id}`);
  }

  // Get all tasks under this epic (not subtasks)
  const epicTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)))
    .all();

  const taskIds = epicTasks.map((t) => t.id);

  // Get all subtasks of those tasks
  let subtaskCount = 0;
  if (taskIds.length > 0) {
    for (const taskId of taskIds) {
      const subtasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.parentTaskId, taskId))
        .all();

      subtaskCount += subtasks.length;

      // Archive subtasks
      if (subtasks.length > 0) {
        await db.update(tasks)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(tasks.parentTaskId, taskId));
      }
    }

    // Archive tasks
    await db.update(tasks)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(tasks.epicId, id), isNull(tasks.parentTaskId)));
  }

  // Complete the epic
  await db.update(epics)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(epics.id, id));

  return {
    epic: id,
    status: "completed",
    archived: {
      tasks: taskIds.length,
      subtasks: subtaskCount,
    },
  };
}
