import { TASK_STATUSES, EPIC_STATUSES, LIST_ENTITY_TYPES, SEARCH_ENTITY_TYPES } from '@/src/types';
import type {
  TaskStatus,
  EpicStatus,
  Priority,
  ListEntityType,
  SearchEntityType,
} from '@/src/types';
import { MAX_PRIORITY, RADIX_DECIMAL } from '@/src/utils/constants';

interface PageInput {
  limit: string;
  page: string;
}

interface PageNumbers {
  limit: number;
  page: number;
}

export abstract class Validator {
  private static isValidTaskStatus(status: string): status is TaskStatus {
    return TASK_STATUS_SET.has(status);
  }

  private static isValidEpicStatus(status: string): status is EpicStatus {
    return EPIC_STATUS_SET.has(status);
  }

  private static isValidPriority(priority: number): priority is Priority {
    return Number.isInteger(priority) && priority >= 0 && priority <= MAX_PRIORITY;
  }

  static parseTaskStatus(status: string | undefined): TaskStatus | undefined {
    if (!status) {
      return undefined;
    }
    const normalizedStatus = Validator.normalizeStatus(status);
    if (!Validator.isValidTaskStatus(normalizedStatus)) {
      throw new Error(`Invalid task status: ${status}. Valid values: ${TASK_STATUSES.join(', ')}`);
    }
    return normalizedStatus;
  }

  static parseEpicStatus(status: string | undefined): EpicStatus | undefined {
    if (!status) {
      return undefined;
    }
    const normalizedStatus = Validator.normalizeStatus(status);
    if (!Validator.isValidEpicStatus(normalizedStatus)) {
      throw new Error(`Invalid epic status: ${status}. Valid values: ${EPIC_STATUSES.join(', ')}`);
    }
    return normalizedStatus;
  }

  private static normalizeStatus(status: string): string {
    return status.toLowerCase().replace(/-/g, '_');
  }

  static parsePriority(priority: string | undefined): Priority | undefined {
    if (priority === undefined) {
      return undefined;
    }

    const num = Number.parseInt(priority, RADIX_DECIMAL);
    if (Number.isNaN(num) || !Validator.isValidPriority(num)) {
      throw new Error(`Invalid priority: ${priority}. Must be a number between 0 and 5.`);
    }
    return num;
  }

  static validateRequired(value: unknown, fieldName: string): asserts value is string {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }

  private static validatePagination(limit: number, page: number): void {
    if (Number.isNaN(limit) || limit < 1) {
      throw new Error('Invalid limit value');
    }
    if (Number.isNaN(page) || page < 1) {
      throw new Error('Invalid page value');
    }
  }

  static parsePaginationOptions(opts: PageInput): PageNumbers {
    const limit = Number.parseInt(opts.limit, RADIX_DECIMAL);
    const page = Number.parseInt(opts.page, RADIX_DECIMAL);
    Validator.validatePagination(limit, page);
    return { limit, page };
  }

  static validateListEntityTypes(types: string[]): asserts types is ListEntityType[] {
    for (const t of types) {
      if (!LIST_ENTITY_TYPE_SET.has(t)) {
        throw new Error(`Invalid type: ${t}. Valid types: ${LIST_ENTITY_TYPES.join(', ')}`);
      }
    }
  }

  static validateSearchEntityTypes(types: string[]): asserts types is SearchEntityType[] {
    for (const t of types) {
      if (!SEARCH_ENTITY_TYPE_SET.has(t)) {
        throw new Error(`Invalid type: ${t}. Valid types: ${SEARCH_ENTITY_TYPES.join(', ')}`);
      }
    }
  }

  static validatePriorities(priorities: number[]): void {
    for (const p of priorities) {
      if (Number.isNaN(p) || p < 0 || p > MAX_PRIORITY) {
        throw new Error(`Invalid priority: ${p}. Valid priorities: 0-5`);
      }
    }
  }

  static validateHistoryTypes(types: string[]): asserts types is HistoryEntityType[] {
    for (const t of types) {
      if (!VALID_HISTORY_TYPES.has(t)) {
        throw new Error(`Invalid type: ${t}. Valid types: ${[...VALID_HISTORY_TYPES].join(', ')}`);
      }
    }
  }

  static validateHistoryActions(actions: string[]): asserts actions is HistoryAction[] {
    for (const a of actions) {
      if (!VALID_HISTORY_ACTIONS.has(a)) {
        throw new Error(
          `Invalid action: ${a}. Valid actions: ${[...VALID_HISTORY_ACTIONS].join(', ')}`
        );
      }
    }
  }

  static parseCommaSeparated(input: string | undefined): string[] | undefined {
    if (!input) {
      return undefined;
    }
    return input.split(',').map((s) => {
      return s.trim();
    });
  }
}

const TASK_STATUS_SET: ReadonlySet<string> = new Set(TASK_STATUSES);
const EPIC_STATUS_SET: ReadonlySet<string> = new Set(EPIC_STATUSES);
const LIST_ENTITY_TYPE_SET: ReadonlySet<string> = new Set(LIST_ENTITY_TYPES);
const SEARCH_ENTITY_TYPE_SET: ReadonlySet<string> = new Set(SEARCH_ENTITY_TYPES);

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
