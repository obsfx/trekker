import { DbClient } from '@/src/db/client';

export abstract class BatchQueries {
  static queryByIds<TRow>(sql: string, ids: readonly string[]): TRow[] {
    if (ids.length === 0) {
      return [];
    }
    return DbClient.requireSqliteInstance().query<TRow, [string]>(sql).all(JSON.stringify(ids));
  }

  static uniqueIds(values: readonly (string | null)[]): string[] {
    return [
      ...new Set(
        values.filter((value) => {
          return value !== null;
        })
      ),
    ];
  }
}

export const IDS_PARAM = 'SELECT value FROM json_each(?)';
