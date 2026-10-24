import dayjs from 'dayjs';

export abstract class UpdateFields {
  static from<T extends object>(
    input: T,
    keys: readonly (keyof T & string)[]
  ): Record<string, unknown> {
    const updates: Record<string, unknown> = { updatedAt: dayjs().toDate() };
    for (const key of keys) {
      const value = input[key];
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    return updates;
  }
}
