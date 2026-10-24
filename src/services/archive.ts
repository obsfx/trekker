import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import { MS_PER_SECOND } from '@/src/utils/constants';

export abstract class ArchiveService {
  static archiveCompleted(): ArchiveResult {
    const sqlite = DbClient.requireSqliteInstance();
    const archive = sqlite.transaction((now: number): ArchiveResult => {
      const tasks = sqlite
        .query<
          ArchivedRow,
          [number]
        >("UPDATE tasks SET status = 'archived', updated_at = ? WHERE status = 'completed' RETURNING id")
        .all(now);
      const epics = sqlite
        .query<
          ArchivedRow,
          [number]
        >("UPDATE epics SET status = 'archived', updated_at = ? WHERE status = 'completed' RETURNING id")
        .all(now);
      return { tasks: tasks.length, epics: epics.length };
    });
    return archive(Math.floor(dayjs().valueOf() / MS_PER_SECOND));
  }
}

export interface ArchiveResult {
  tasks: number;
  epics: number;
}

interface ArchivedRow {
  id: string;
}
