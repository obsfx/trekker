// Re-export all constants from shared
export * from "@trekker/shared/constants";

// Also re-export types that are commonly used with constants
export { TASK_STATUSES, EPIC_STATUSES } from "@trekker/shared/types";
export type { TaskStatus, EpicStatus } from "@trekker/shared/types";
