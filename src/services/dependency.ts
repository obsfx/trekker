import { eq } from "drizzle-orm";
import { getDb, getDbForEntity, getAllDbNames, parseDbFromId } from "../db/client";
import { dependencies, tasks } from "../db/schema";
import { generateUuid } from "../utils/id-generator";
import type { Dependency } from "../types";

export function addDependency(taskId: string, dependsOnId: string): Dependency {
  // Validate both tasks exist (in their respective DBs)
  const taskDb = getDbForEntity(taskId);
  const task = taskDb.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const dependsOnDb = getDbForEntity(dependsOnId);
  const dependsOnTask = dependsOnDb
    .select()
    .from(tasks)
    .where(eq(tasks.id, dependsOnId))
    .get();
  if (!dependsOnTask) {
    throw new Error(`Task not found: ${dependsOnId}`);
  }

  // Can't depend on itself
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself.");
  }

  // Check if dependency already exists (stored in taskId's DB)
  const existing = taskDb
    .select()
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all()
    .find((d) => d.dependsOnId === dependsOnId);

  if (existing) {
    throw new Error(`Dependency already exists: ${taskId} → ${dependsOnId}`);
  }

  // Check for cycles across all DBs
  if (wouldCreateCycle(taskId, dependsOnId)) {
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

  // Store dependency in the taskId's DB
  taskDb.insert(dependencies).values(dependency).run();

  return dependency as Dependency;
}

export function removeDependency(taskId: string, dependsOnId: string): void {
  const db = getDbForEntity(taskId);

  const existing = db
    .select()
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all()
    .find((d) => d.dependsOnId === dependsOnId);

  if (!existing) {
    throw new Error(`Dependency not found: ${taskId} → ${dependsOnId}`);
  }

  db.delete(dependencies).where(eq(dependencies.id, existing.id)).run();
}

export function getDependencies(taskId: string): {
  dependsOn: Array<{ taskId: string; dependsOnId: string }>;
  blocks: Array<{ taskId: string; dependsOnId: string }>;
} {
  const taskDbName = parseDbFromId(taskId);

  // Tasks that this task depends on — query taskId's DB
  const taskDb = getDb(taskDbName);
  const dependsOn = taskDb
    .select({
      taskId: dependencies.taskId,
      dependsOnId: dependencies.dependsOnId,
    })
    .from(dependencies)
    .where(eq(dependencies.taskId, taskId))
    .all();

  // Tasks that are blocked by this task — scan ALL DBs
  const blocks: Array<{ taskId: string; dependsOnId: string }> = [];
  const allDbNames = getAllDbNames();
  for (const dbName of allDbNames) {
    const db = getDb(dbName);
    const dbBlocks = db
      .select({
        taskId: dependencies.taskId,
        dependsOnId: dependencies.dependsOnId,
      })
      .from(dependencies)
      .where(eq(dependencies.dependsOnId, taskId))
      .all();
    blocks.push(...dbBlocks);
  }

  return { dependsOn, blocks };
}

/**
 * Cross-DB cycle detection using DFS.
 * For each node, determine its DB from the ID prefix,
 * then query that DB for dependencies.
 */
function wouldCreateCycle(taskId: string, dependsOnId: string): boolean {
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

    // Determine which DB this task's dependencies are stored in
    let currentDbName: string;
    try {
      currentDbName = parseDbFromId(current);
    } catch {
      continue; // Skip if ID can't be parsed
    }

    let db;
    try {
      db = getDb(currentDbName);
    } catch {
      continue; // Skip if DB doesn't exist
    }

    // Get all tasks that `current` depends on
    const deps = db
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

export function getAllDependencies(): Array<{
  taskId: string;
  dependsOnId: string;
}> {
  const allDbNames = getAllDbNames();
  const allDeps: Array<{ taskId: string; dependsOnId: string }> = [];

  for (const dbName of allDbNames) {
    const db = getDb(dbName);
    const deps = db
      .select({
        taskId: dependencies.taskId,
        dependsOnId: dependencies.dependsOnId,
      })
      .from(dependencies)
      .all();
    allDeps.push(...deps);
  }

  return allDeps;
}
