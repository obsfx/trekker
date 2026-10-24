import { generateKeyBetween } from 'fractional-indexing';
import { DbClient } from '@/src/db/client';

export abstract class Ranks {
  private static rankBeforeFirst(): string {
    const row = DbClient.requireSqliteInstance()
      .query<RankRow, []>(
        `SELECT MIN(rank) AS rank FROM (
          SELECT MIN(rank) AS rank FROM epics
          UNION ALL
          SELECT MIN(rank) AS rank FROM tasks
        )`
      )
      .get();
    return generateKeyBetween(null, row?.rank ?? null);
  }

  static insertWithFirstRank(insert: (rank: string) => void): void {
    const sqlite = DbClient.requireSqliteInstance();
    const transaction = sqlite.transaction(() => {
      insert(Ranks.rankBeforeFirst());
    });
    transaction.immediate();
  }
}

interface RankRow {
  rank: string | null;
}
