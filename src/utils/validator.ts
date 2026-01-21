import {
  TASK_STATUSES,
  EPIC_STATUSES,
  LIST_ENTITY_TYPES,
  SEARCH_ENTITY_TYPES,
  type TaskStatus,
  type EpicStatus,
  type Priority,
  type ListEntityType,
  type SearchEntityType,
} from "../types";

export function isValidTaskStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus);
}

export function isValidEpicStatus(status: string): status is EpicStatus {
  return EPIC_STATUSES.includes(status as EpicStatus);
}

export function isValidPriority(priority: number): priority is Priority {
  return Number.isInteger(priority) && priority >= 0 && priority <= 5;
}

export function parseStatus(
  status: string | undefined,
  type: "task" | "epic"
): TaskStatus | EpicStatus | undefined {
  if (!status) return undefined;

  const normalizedStatus = status.toLowerCase().replace(/-/g, "_");

  if (type === "task") {
    if (!isValidTaskStatus(normalizedStatus)) {
      throw new Error(
        `Invalid task status: ${status}. Valid values: ${TASK_STATUSES.join(", ")}`
      );
    }
    return normalizedStatus;
  } else {
    if (!isValidEpicStatus(normalizedStatus)) {
      throw new Error(
        `Invalid epic status: ${status}. Valid values: ${EPIC_STATUSES.join(", ")}`
      );
    }
    return normalizedStatus;
  }
}

export function parsePriority(priority: string | undefined): Priority | undefined {
  if (priority === undefined) return undefined;

  const num = parseInt(priority, 10);
  if (isNaN(num) || !isValidPriority(num)) {
    throw new Error(`Invalid priority: ${priority}. Must be a number between 0 and 5.`);
  }
  return num as Priority;
}

export function validateRequired(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${fieldName} is required`);
  }
}

export function validatePagination(limit: number, page: number): void {
  if (isNaN(limit) || limit < 1) {
    throw new Error("Invalid limit value");
  }
  if (isNaN(page) || page < 1) {
    throw new Error("Invalid page value");
  }
}

export function validateListEntityTypes(types: string[]): asserts types is ListEntityType[] {
  for (const t of types) {
    if (!LIST_ENTITY_TYPES.includes(t as ListEntityType)) {
      throw new Error(`Invalid type: ${t}. Valid types: ${LIST_ENTITY_TYPES.join(", ")}`);
    }
  }
}

export function validateSearchEntityTypes(types: string[]): asserts types is SearchEntityType[] {
  for (const t of types) {
    if (!SEARCH_ENTITY_TYPES.includes(t as SearchEntityType)) {
      throw new Error(`Invalid type: ${t}. Valid types: ${SEARCH_ENTITY_TYPES.join(", ")}`);
    }
  }
}

export function validatePriorities(priorities: number[]): void {
  for (const p of priorities) {
    if (isNaN(p) || p < 0 || p > 5) {
      throw new Error(`Invalid priority: ${p}. Valid priorities: 0-5`);
    }
  }
}
