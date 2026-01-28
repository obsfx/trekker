/**
 * Truncate text to a maximum length, appending "..." if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Build searchable text from an entity with title and optional description.
 */
export function buildEntityText(entity: { title: string; description?: string | null }): string {
  if (!entity.description) return entity.title;
  return `${entity.title} ${entity.description}`;
}
