import {
  TASK_STATUSES,
  EPIC_STATUSES,
  type TaskStatus,
  type EpicStatus,
  type Priority,
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
