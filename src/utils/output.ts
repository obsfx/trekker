import { encode } from '@toon-format/toon';
import type { Epic, Task, Comment, PaginatedResponse } from '../types';
import { STATUS_PAD_WIDTH, JSON_INDENT } from './constants';

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
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, JSON_INDENT));
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
  if (err instanceof Error) {
    error(err.message);
  } else {
    error(String(err));
  }
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
    return;
  }
  if (successMessage) {
    success(successMessage);
  }
  console.log(formatter(data));
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

  return lines.join('\n');
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

  return lines.join('\n');
}

export function formatComment(comment: Comment): string {
  const lines = [
    `ID:      ${comment.id}`,
    `Author:  ${comment.author}`,
    `Content: ${comment.content}`,
    `Created: ${comment.createdAt.toISOString()}`,
  ];

  return lines.join('\n');
}

export function formatDependencyList(
  dependencies: { taskId: string; dependsOnId: string }[],
  direction: 'depends_on' | 'blocks'
): string {
  if (dependencies.length === 0) {
    if (direction === 'depends_on') {
      return 'No dependencies.';
    }
    return 'Does not block any tasks.';
  }

  if (direction === 'depends_on') {
    return dependencies.map((d) => `  → depends on ${d.dependsOnId}`).join('\n');
  }
  return dependencies.map((d) => `  → blocks ${d.taskId}`).join('\n');
}

function formatPaginationFooter(total: number, page: number, limit: number): string {
  const totalPages = Math.ceil(total / limit);
  if (totalPages > 1) {
    return `\nPage ${page} of ${totalPages}`;
  }
  return '';
}

export function formatPaginatedTaskList(result: PaginatedResponse<Task>): string {
  const lines: string[] = [];
  lines.push(`${result.total} task(s) (page ${result.page}, ${result.limit} per page)\n`);

  if (result.items.length === 0) {
    lines.push('No tasks found.');
    return lines.join('\n');
  }

  for (const task of result.items) {
    let tags = '';
    if (task.tags) {
      tags = ` [${task.tags}]`;
    }
    let parent = '';
    if (task.parentTaskId) {
      parent = ` (subtask of ${task.parentTaskId})`;
    }
    lines.push(
      `${task.id} | ${task.status.padEnd(STATUS_PAD_WIDTH)} | P${task.priority} | ${task.title}${tags}${parent}`
    );
  }

  lines.push(formatPaginationFooter(result.total, result.page, result.limit));
  return lines.join('\n');
}

export function formatPaginatedEpicList(result: PaginatedResponse<Epic>): string {
  const lines: string[] = [];
  lines.push(`${result.total} epic(s) (page ${result.page}, ${result.limit} per page)\n`);

  if (result.items.length === 0) {
    lines.push('No epics found.');
    return lines.join('\n');
  }

  for (const epic of result.items) {
    lines.push(
      `${epic.id} | ${epic.status.padEnd(STATUS_PAD_WIDTH)} | P${epic.priority} | ${epic.title}`
    );
  }

  lines.push(formatPaginationFooter(result.total, result.page, result.limit));
  return lines.join('\n');
}

export function formatPaginatedCommentList(result: PaginatedResponse<Comment>): string {
  const lines: string[] = [];
  lines.push(`${result.total} comment(s) (page ${result.page}, ${result.limit} per page)\n`);

  if (result.items.length === 0) {
    lines.push('No comments found.');
    return lines.join('\n');
  }

  for (const c of result.items) {
    lines.push(`[${c.id}] ${c.author}: ${c.content}`);
  }

  lines.push(formatPaginationFooter(result.total, result.page, result.limit));
  return lines.join('\n');
}
