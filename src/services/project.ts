import { getDb, createDb, isTrekkerInitialized, isDbInitialized, deleteDb, deleteNamedDb } from "../db/client";
import { projects } from "../db/schema";
import { generateUuid } from "../utils/id-generator";
import { getCurrentDbName } from "../utils/db-context";
import { basename } from "path";

export function initProject(cwd: string = process.cwd(), dbName?: string): void {
  const name = dbName ?? getCurrentDbName();

  if (isDbInitialized(name, cwd)) {
    throw new Error(`Database '${name}' is already initialized in this directory.`);
  }

  const db = createDb(name, cwd);
  const projectName = basename(cwd);
  const now = new Date();

  db.insert(projects).values({
    id: generateUuid(),
    name: projectName,
    createdAt: now,
    updatedAt: now,
  }).run();
}

export function getProject(cwd: string = process.cwd(), dbName?: string) {
  const name = dbName ?? getCurrentDbName();
  const db = getDb(name, cwd);
  return db.select().from(projects).get();
}

export function wipeProject(cwd: string = process.cwd(), dbName?: string): void {
  if (dbName) {
    if (!isDbInitialized(dbName, cwd)) {
      throw new Error(`Database '${dbName}' is not initialized in this directory.`);
    }
    deleteNamedDb(dbName, cwd);
  } else {
    if (!isTrekkerInitialized(cwd)) {
      throw new Error("Trekker is not initialized in this directory.");
    }
    deleteDb(cwd);
  }
}

export { isTrekkerInitialized, isDbInitialized };
