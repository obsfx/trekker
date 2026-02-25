import { TASK_STATUSES, EPIC_STATUSES, LIST_ENTITY_TYPES, SEARCH_ENTITY_TYPES } from '../types';
import type { TaskStatus, EpicStatus, Priority, ListEntityType, SearchEntityType } from '../types';
import { MAX_PRIORITY, RADIX_DECIMAL } from './constants';

const TASK_STATUS_SET: ReadonlySet<string> = new Set(TASK_STATUSES);
const EPIC_STATUS_SET: ReadonlySet<string> = new Set(EPIC_STATUSES);
const LIST_ENTITY_TYPE_SET: ReadonlySet<string> = new Set(LIST_ENTITY_TYPES);
const SEARCH_ENTITY_TYPE_SET: ReadonlySet<string> = new Set(SEARCH_ENTITY_TYPES);

function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUS_SET.has(status);
}

function isValidEpicStatus(status: string): status is EpicStatus {
  return EPIC_STATUS_SET.has(status);
}

function isValidPriority(priority: number): priority is Priority {
  return Number.isInteger(priority) && priority >= 0 && priority <= MAX_PRIORITY;
}

export function parseStatus(status: string | undefined, type: 'task'): TaskStatus | undefined;
export function parseStatus(status: string | undefined, type: 'epic'): EpicStatus | undefined;
export function parseStatus(
  status: string | undefined,
  type: 'task' | 'epic'
): TaskStatus | EpicStatus | undefined {
  if (!status) {
    return undefined;
  }

  const normalizedStatus = status.toLowerCase().replace(/-/g, '_');

  if (type === 'task') {
    if (!isValidTaskStatus(normalizedStatus)) {
      throw new Error(`Invalid task status: ${status}. Valid values: ${TASK_STATUSES.join(', ')}`);
    }
    return normalizedStatus;
  }

  if (!isValidEpicStatus(normalizedStatus)) {
    throw new Error(`Invalid epic status: ${status}. Valid values: ${EPIC_STATUSES.join(', ')}`);
  }
  return normalizedStatus;
}

export function parsePriority(priority: string | undefined): Priority | undefined {
  if (priority === undefined) {
    return undefined;
  }

  const num = Number.parseInt(priority, RADIX_DECIMAL);
  if (Number.isNaN(num) || !isValidPriority(num)) {
    throw new Error(`Invalid priority: ${priority}. Must be a number between 0 and 5.`);
  }
  return num;
}

export function validateRequired(value: unknown, fieldName: string): asserts value is string {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required`);
  }
}

function validatePagination(limit: number, page: number): void {
  if (Number.isNaN(limit) || limit < 1) {
    throw new Error('Invalid limit value');
  }
  if (Number.isNaN(page) || page < 1) {
    throw new Error('Invalid page value');
  }
}

export function parsePaginationOptions(opts: { limit: string; page: string }): {
  limit: number;
  page: number;
} {
  const limit = Number.parseInt(opts.limit, RADIX_DECIMAL);
  const page = Number.parseInt(opts.page, RADIX_DECIMAL);
  validatePagination(limit, page);
  return { limit, page };
}

export function validateListEntityTypes(types: string[]): asserts types is ListEntityType[] {
  for (const t of types) {
    if (!LIST_ENTITY_TYPE_SET.has(t)) {
      throw new Error(`Invalid type: ${t}. Valid types: ${LIST_ENTITY_TYPES.join(', ')}`);
    }
  }
}

export function validateSearchEntityTypes(types: string[]): asserts types is SearchEntityType[] {
  for (const t of types) {
    if (!SEARCH_ENTITY_TYPE_SET.has(t)) {
      throw new Error(`Invalid type: ${t}. Valid types: ${SEARCH_ENTITY_TYPES.join(', ')}`);
    }
  }
}

export function validatePriorities(priorities: number[]): void {
  for (const p of priorities) {
    if (Number.isNaN(p) || p < 0 || p > MAX_PRIORITY) {
      throw new Error(`Invalid priority: ${p}. Valid priorities: 0-5`);
    }
  }
}

type HistoryEntityType = 'epic' | 'task' | 'subtask' | 'comment' | 'dependency';
type HistoryAction = 'create' | 'update' | 'delete';

const VALID_HISTORY_TYPES: ReadonlySet<string> = new Set([
  'epic',
  'task',
  'subtask',
  'comment',
  'dependency',
]);
const VALID_HISTORY_ACTIONS: ReadonlySet<string> = new Set(['create', 'update', 'delete']);

export function validateHistoryTypes(types: string[]): asserts types is HistoryEntityType[] {
  for (const t of types) {
    if (!VALID_HISTORY_TYPES.has(t)) {
      throw new Error(`Invalid type: ${t}. Valid types: ${[...VALID_HISTORY_TYPES].join(', ')}`);
    }
  }
}

export function validateHistoryActions(actions: string[]): asserts actions is HistoryAction[] {
  for (const a of actions) {
    if (!VALID_HISTORY_ACTIONS.has(a)) {
      throw new Error(
        `Invalid action: ${a}. Valid actions: ${[...VALID_HISTORY_ACTIONS].join(', ')}`
      );
    }
  }
}

export function parseCommaSeparated(input: string | undefined): string[] | undefined {
  if (!input) {
    return undefined;
  }
  return input.split(',').map((s) => s.trim());
}
