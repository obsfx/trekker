import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import type { EpicStatus, Priority, TaskStatus } from '../types';

// Project table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const projectConfig = sqliteTable('project_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Epic table
export const epics = sqliteTable('epics', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo').$type<EpicStatus>(),
  priority: integer('priority').notNull().default(2).$type<Priority>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Task table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  epicId: text('epic_id'),
  parentTaskId: text('parent_task_id'),
  title: text('title').notNull(),
  description: text('description'),
  priority: integer('priority').notNull().default(2).$type<Priority>(),
  status: text('status').notNull().default('todo').$type<TaskStatus>(),
  tags: text('tags'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Comment table
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  author: text('author').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Dependency table
export const dependencies = sqliteTable('dependencies', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull(),
  dependsOnId: text('depends_on_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ID counter table for per-entity sequential ID generation
export const idCounters = sqliteTable('id_counters', {
  entityType: text('entity_type').primaryKey(),
  counter: integer('counter').notNull().default(0),
});

// Events table for history/logbook
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // create, update, delete
  entityType: text('entity_type').notNull(), // epic, task, subtask, comment, dependency
  entityId: text('entity_id').notNull(),
  snapshot: text('snapshot'), // Full JSON for create/delete
  changes: text('changes'), // JSON diff for update
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
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
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  comments: many(comments),
  dependsOn: many(dependencies, { relationName: 'dependsOn' }),
  blockedBy: many(dependencies, { relationName: 'blockedBy' }),
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
    relationName: 'dependsOn',
  }),
  dependsOn: one(tasks, {
    fields: [dependencies.dependsOnId],
    references: [tasks.id],
    relationName: 'blockedBy',
  }),
}));
