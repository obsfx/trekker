// Status labels for display
export const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "In Progress",
  completed: "Completed",
  wont_fix: "Won't Fix",
  archived: "Archived",
};

// Status colors (Tailwind classes)
export const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  wont_fix: "bg-amber-500",
  archived: "bg-gray-400",
};

// Status styles (for inline styles)
export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  todo: { bg: "#6b7280", text: "#ffffff" },
  in_progress: { bg: "#3b82f6", text: "#ffffff" },
  completed: { bg: "#22c55e", text: "#ffffff" },
  wont_fix: { bg: "#f59e0b", text: "#ffffff" },
  archived: { bg: "#9ca3af", text: "#ffffff" },
};

// Priority labels
export const PRIORITY_LABELS: Record<number, string> = {
  0: "Critical",
  1: "High",
  2: "Medium",
  3: "Low",
  4: "Backlog",
  5: "Someday",
};

// Priority styles (for inline styles)
export const PRIORITY_STYLES: Record<number, { bg: string; text: string }> = {
  0: { bg: "#dc2626", text: "#ffffff" }, // Critical - red
  1: { bg: "#ea580c", text: "#ffffff" }, // High - orange
  2: { bg: "#ca8a04", text: "#ffffff" }, // Medium - yellow
  3: { bg: "#6b7280", text: "#ffffff" }, // Low - gray
  4: { bg: "#6b7280", text: "#ffffff" }, // Backlog - gray
  5: { bg: "#9ca3af", text: "#ffffff" }, // Someday - light gray
};

// Type border colors (Tailwind classes)
export const TYPE_BORDER_COLORS = {
  epic: "border-l-purple-500",
  task: "border-l-blue-500",
  subtask: "border-l-gray-400",
} as const;

// Type card styles (for inline styles)
export const TYPE_CARD_STYLES = {
  epic: {
    light: "rgba(168, 85, 247, 0.1)",
    dark: "rgba(168, 85, 247, 0.2)",
  },
  task: {
    light: "rgba(59, 130, 246, 0.1)",
    dark: "rgba(59, 130, 246, 0.2)",
  },
  subtask: {
    light: "rgba(107, 114, 128, 0.1)",
    dark: "rgba(107, 114, 128, 0.2)",
  },
} as const;

export type CardType = keyof typeof TYPE_CARD_STYLES;

export function getCardType(task: {
  id: string;
  parentTaskId: string | null;
}): CardType {
  if (task.id.startsWith("EPIC-")) return "epic";
  if (task.parentTaskId) return "subtask";
  return "task";
}
