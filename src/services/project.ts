import { getDb, createDb, isTrekkerInitialized, deleteDb } from "../db/client";
import { projects } from "../db/schema";
import { generateUuid } from "../utils/id-generator";
import { basename } from "path";

export function initProject(cwd: string = process.cwd()): void {
  if (isTrekkerInitialized(cwd)) {
    throw new Error("Trekker is already initialized in this directory.");
  }

  const db = createDb(cwd);
  const projectName = basename(cwd);
  const now = new Date();

  db.insert(projects).values({
    id: generateUuid(),
    name: projectName,
    createdAt: now,
    updatedAt: now,
  }).run();
}

export function getProject(cwd: string = process.cwd()) {
  const db = getDb(cwd);
  return db.select().from(projects).get();
}

export function wipeProject(cwd: string = process.cwd()): void {
  if (!isTrekkerInitialized(cwd)) {
    throw new Error("Trekker is not initialized in this directory.");
  }
  deleteDb(cwd);
}

export { isTrekkerInitialized };
