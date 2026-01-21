import { encode } from "@toon-format/toon";
import type { Epic, Task, Comment } from "../types";

let toonMode = false;

export function setToonMode(enabled: boolean): void {
  toonMode = enabled;
}

export function isToonMode(): boolean {
  return toonMode;
}

export function output(data: unknown): void {
  if (toonMode) {
    console.log(encode(data));
  } else if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function success(message: string, data?: unknown): void {
  if (toonMode) {
    console.log(encode({ success: true, message, data }));
  } else {
    console.log(`✓ ${message}`);
    if (data) {
      output(data);
    }
  }
}

export function error(message: string, details?: unknown): void {
  if (toonMode) {
    console.error(encode({ success: false, error: message, details }));
  } else {
    console.error(`✗ Error: ${message}`);
    if (details) {
      console.error(details);
    }
  }
}

/**
 * Handles command errors with consistent formatting and exits with code 1.
 * Use in catch blocks to replace duplicate error handling patterns.
 */
export function handleCommandError(err: unknown): never {
  error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

/**
 * Handles entity not found with error message and exits with code 1.
 */
export function handleNotFound(entityType: string, id: string): never {
  error(`${entityType} not found: ${id}`);
  process.exit(1);
}

/**
 * Outputs result in appropriate format (toon or standard).
 * Reduces duplicate if/else branching in commands.
 */
export function outputResult<T>(
  data: T,
  formatter: (data: T) => string,
  successMessage?: string
): void {
  if (isToonMode()) {
    output(data);
  } else {
    if (successMessage) {
      success(successMessage);
    }
    console.log(formatter(data));
  }
}

export function info(message: string): void {
  if (!toonMode) {
    console.log(message);
  }
}

export function formatTask(task: Task): string {
  const lines = [
    `ID:          ${task.id}`,
    `Title:       ${task.title}`,
    `Status:      ${task.status}`,
    `Priority:    ${task.priority}`,
  ];

  if (task.description) {
    lines.push(`Description: ${task.description}`);
  }
  if (task.epicId) {
    lines.push(`Epic:        ${task.epicId}`);
  }
  if (task.parentTaskId) {
    lines.push(`Parent:      ${task.parentTaskId}`);
  }
  if (task.tags) {
    lines.push(`Tags:        ${task.tags}`);
  }
  lines.push(`Created:     ${task.createdAt.toISOString()}`);
  lines.push(`Updated:     ${task.updatedAt.toISOString()}`);

  return lines.join("\n");
}

export function formatEpic(epic: Epic): string {
  const lines = [
    `ID:          ${epic.id}`,
    `Title:       ${epic.title}`,
    `Status:      ${epic.status}`,
    `Priority:    ${epic.priority}`,
  ];

  if (epic.description) {
    lines.push(`Description: ${epic.description}`);
  }
  lines.push(`Created:     ${epic.createdAt.toISOString()}`);
  lines.push(`Updated:     ${epic.updatedAt.toISOString()}`);

  return lines.join("\n");
}

export function formatComment(comment: Comment): string {
  const lines = [
    `ID:      ${comment.id}`,
    `Author:  ${comment.author}`,
    `Content: ${comment.content}`,
    `Created: ${comment.createdAt.toISOString()}`,
  ];

  return lines.join("\n");
}

export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "No tasks found.";
  }

  const lines = tasks.map((task) => {
    const tags = task.tags ? ` [${task.tags}]` : "";
    const parent = task.parentTaskId ? ` (subtask of ${task.parentTaskId})` : "";
    return `${task.id} | ${task.status.padEnd(11)} | P${task.priority} | ${task.title}${tags}${parent}`;
  });

  return lines.join("\n");
}

export function formatEpicList(epics: Epic[]): string {
  if (epics.length === 0) {
    return "No epics found.";
  }

  const lines = epics.map((epic) => {
    return `${epic.id} | ${epic.status.padEnd(11)} | P${epic.priority} | ${epic.title}`;
  });

  return lines.join("\n");
}

export function formatCommentList(comments: Comment[]): string {
  if (comments.length === 0) {
    return "No comments found.";
  }

  return comments
    .map((c) => `[${c.id}] ${c.author}: ${c.content}`)
    .join("\n");
}

export function formatDependencyList(
  dependencies: Array<{ taskId: string; dependsOnId: string }>,
  direction: "depends_on" | "blocks"
): string {
  if (dependencies.length === 0) {
    return direction === "depends_on"
      ? "No dependencies."
      : "Does not block any tasks.";
  }

  if (direction === "depends_on") {
    return dependencies.map((d) => `  → depends on ${d.dependsOnId}`).join("\n");
  } else {
    return dependencies.map((d) => `  → blocks ${d.taskId}`).join("\n");
  }
}
