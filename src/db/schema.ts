import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Project table
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Epic table
export const epics = sqliteTable("epics", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: integer("priority").notNull().default(2),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Task table
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  epicId: text("epic_id").references(() => epics.id, { onDelete: "set null" }),
  parentTaskId: text("parent_task_id"),
  title: text("title").notNull(),
  description: text("description"),
  priority: integer("priority").notNull().default(2),
  status: text("status").notNull().default("todo"),
  tags: text("tags"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Comment table
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Dependency table
export const dependencies = sqliteTable("dependencies", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnId: text("depends_on_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ID counter table for TREK-n format
export const idCounters = sqliteTable("id_counters", {
  entityType: text("entity_type").primaryKey(),
  counter: integer("counter").notNull().default(0),
});

// Relations
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
