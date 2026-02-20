import { requireSqliteInstance } from "../db/client";

export interface ReadyTask {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  epicId: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  dependents: ReadyTaskDependent[];
}

export interface ReadyTaskDependent {
  id: string;
  title: string;
  status: string;
  priority: number;
}

export function getReadyTasks(): ReadyTask[] {
  const sqlite = requireSqliteInstance();

  // Find todo tasks (not subtasks) that have no incomplete dependencies
  const readyRows = sqlite
    .query(
      `
      SELECT t.id, t.title, t.description, t.priority, t.status,
             t.epic_id, t.tags, t.created_at, t.updated_at
      FROM tasks t
      WHERE t.status = 'todo'
        AND t.parent_task_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM dependencies d
          JOIN tasks dt ON dt.id = d.depends_on_id
          WHERE d.task_id = t.id
            AND dt.status NOT IN ('completed', 'wont_fix', 'archived')
        )
      ORDER BY t.priority ASC, t.created_at ASC
    `
    )
    .all() as Array<{
    id: string;
    title: string;
    description: string | null;
    priority: number;
    status: string;
    epic_id: string | null;
    tags: string | null;
    created_at: number;
    updated_at: number;
  }>;

  // For each ready task, find its downstream dependents
  const dependentsQuery = sqlite.query(
    `
    SELECT t.id, t.title, t.status, t.priority
    FROM dependencies d
    JOIN tasks t ON t.id = d.task_id
    WHERE d.depends_on_id = ?
    ORDER BY t.priority ASC
  `
  );

  return readyRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    epicId: row.epic_id,
    tags: row.tags,
    createdAt: new Date(row.created_at * 1000),
    updatedAt: new Date(row.updated_at * 1000),
    dependents: (
      dependentsQuery.all(row.id) as Array<{
        id: string;
        title: string;
        status: string;
        priority: number;
      }>
    ).map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      priority: d.priority,
    })),
  }));
}
