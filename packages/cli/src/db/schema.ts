import { relations } from "drizzle-orm";
import {
  projects,
  epics,
  tasks,
  comments,
  dependencies,
  idCounters,
} from "@trekker/shared";

// Re-export table definitions from shared
export { projects, epics, tasks, comments, dependencies, idCounters };

// Relations (defined locally, reference the shared tables)
export const projectsRelations = relations(projects, ({ many }) => ({
  epics: many(epics),
  tasks: many(tasks),
}));

export const epicsRelations = relations(epics, ({ one, many }) => ({
  project: one(projects, {
    fields: [epics.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  epic: one(epics, {
    fields: [tasks.epicId],
    references: [epics.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  comments: many(comments),
  dependsOn: many(dependencies, { relationName: "dependsOn" }),
  blockedBy: many(dependencies, { relationName: "blockedBy" }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
}));

export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  task: one(tasks, {
    fields: [dependencies.taskId],
    references: [tasks.id],
    relationName: "dependsOn",
  }),
  dependsOn: one(tasks, {
    fields: [dependencies.dependsOnId],
    references: [tasks.id],
    relationName: "blockedBy",
  }),
}));
