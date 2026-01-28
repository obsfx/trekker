import { eq } from "drizzle-orm";
import { getDb } from "../db/client-node";
import { dependencies, tasks } from "../db/schema";
import { generateUuid } from "../utils/id-generator";
import type { Dependency } from "../types";

export async function addDependency(taskId: string, dependsOnId: string): Promise<Dependency> {
  const db = await getDb();

  // Validate both tasks exist
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  // Workaround for drizzle-orm sqlite-proxy bug: empty result returns object with undefined values
  if (!task || task.id === undefined) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const dependsOnTask = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, dependsOnId))
    .get();
  // Workaround for drizzle-orm sqlite-proxy bug
  if (!dependsOnTask || dependsOnTask.id === undefined) {
    throw new Error(`Task not found: ${dependsOnId}`);
  }

  // Can't depend on itself
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself.");
  }

  // Check if dependency already exists
  const existingDeps = await db
    .select()
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all();

  const existing = existingDeps.find((d) => d.dependsOnId === dependsOnId);

  if (existing) {
    throw new Error(`Dependency already exists: ${taskId} → ${dependsOnId}`);
  }

  // Check for cycles
  if (await wouldCreateCycle(taskId, dependsOnId)) {
    throw new Error(
      `Adding this dependency would create a cycle. ${dependsOnId} already depends on ${taskId} (directly or transitively).`
    );
  }

  const id = generateUuid();
  const now = new Date();

  const dependency = {
    id,
    taskId,
    dependsOnId,
    createdAt: now,
  };

  await db.insert(dependencies).values(dependency);

  return dependency as Dependency;
}

export async function removeDependency(taskId: string, dependsOnId: string): Promise<void> {
  const db = await getDb();

  const existingDeps = await db
    .select()
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all();

  const existing = existingDeps.find((d) => d.dependsOnId === dependsOnId);

  if (!existing) {
    throw new Error(`Dependency not found: ${taskId} → ${dependsOnId}`);
  }

  await db.delete(dependencies).where(eq(dependencies.id, existing.id));
}

export async function getDependencies(taskId: string): Promise<{
  dependsOn: Array<{ taskId: string; dependsOnId: string }>;
  blocks: Array<{ taskId: string; dependsOnId: string }>;
}> {
  const db = await getDb();

  // Tasks that this task depends on
  const dependsOn = await db
    .select({
      taskId: dependencies.taskId,
      dependsOnId: dependencies.dependsOnId,
    })
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all();

  // Tasks that are blocked by this task
  const blocks = await db
    .select({
      taskId: dependencies.taskId,
      dependsOnId: dependencies.dependsOnId,
    })
    .from(dependencies)
    .where(eq(dependencies.dependsOnId, taskId))
    .all();

  return { dependsOn, blocks };
}

async function wouldCreateCycle(taskId: string, dependsOnId: string): Promise<boolean> {
  const db = await getDb();

  // Use DFS to check if dependsOnId can reach taskId
  // If so, adding taskId → dependsOnId would create a cycle
  const visited = new Set<string>();
  const stack = [dependsOnId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === taskId) {
      return true; // Found a path from dependsOnId to taskId
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    // Get all tasks that `current` depends on
    const deps = await db
      .select({ dependsOnId: dependencies.dependsOnId })
      .from(dependencies)
      .where(eq(dependencies.taskId, current))
      .all();

    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        stack.push(dep.dependsOnId);
      }
    }
  }

  return false;
}

export async function getAllDependencies(): Promise<Array<{
  taskId: string;
  dependsOnId: string;
}>> {
  const db = await getDb();
  return await db
    .select({
      taskId: dependencies.taskId,
      dependsOnId: dependencies.dependsOnId,
    })
    .from(dependencies)
    .all();
}
