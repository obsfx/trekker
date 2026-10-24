import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import type { Identified } from '@/tests/helpers/shapes';
import type { ErrorBody } from '@/src/types';

interface CollectedPages<T> {
  items: T[];
  totals: number[];
  pages: number;
}

export abstract class ServerFixtures {
  private static async create(server: ServeHandle, path: string, body: unknown): Promise<string> {
    const { status, body: created } = await server.json<Identified>(
      path,
      ServeHelpers.jsonInit('POST', body)
    );
    if (status !== 201) {
      throw new Error(`POST ${path} failed with ${status}: ${JSON.stringify(created)}`);
    }
    return created.id;
  }

  static async seedProject(server: ServeHandle): Promise<SeededProject> {
    const alphaEpic = await ServerFixtures.create(server, '/api/epics', {
      title: 'Alpha epic',
      priority: 1,
    });
    const betaEpic = await ServerFixtures.create(server, '/api/epics', {
      title: 'beta epic',
      priority: 3,
      status: 'in_progress',
    });
    const gammaEpic = await ServerFixtures.create(server, '/api/epics', {
      title: 'Gamma epic',
      priority: 0,
      status: 'completed',
    });
    const epics = {
      alpha: alphaEpic,
      beta: betaEpic,
      gamma: gammaEpic,
    };
    const docsTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Write docs',
      description: 'Document the retry behaviour',
      epicId: epics.alpha,
      tags: ['docs', 'api'],
    });
    const loginTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Add login',
      priority: 0,
      status: 'in_progress',
      epicId: epics.alpha,
    });
    const bugTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Fix bug',
      priority: 1,
      epicId: epics.beta,
    });
    const refactorTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Refactor',
      priority: 4,
      status: 'completed',
    });
    const zebraTask = await ServerFixtures.create(server, '/api/tasks', { title: 'Zebra task' });
    const lowerTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'alpha task',
      priority: 5,
      status: 'wont_fix',
      epicId: epics.gamma,
    });
    const middleTask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Middle',
      priority: 3,
      status: 'archived',
    });
    const tasks = {
      docs: docsTask,
      login: loginTask,
      bug: bugTask,
      refactor: refactorTask,
      zebra: zebraTask,
      lower: lowerTask,
      middle: middleTask,
    };
    const oneSubtask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Sub one',
      status: 'completed',
      parentTaskId: tasks.docs,
    });
    const twoSubtask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Sub two',
      parentTaskId: tasks.docs,
    });
    const threeSubtask = await ServerFixtures.create(server, '/api/tasks', {
      title: 'Sub three',
      parentTaskId: tasks.bug,
    });
    const subtasks = {
      one: oneSubtask,
      two: twoSubtask,
      three: threeSubtask,
    };

    await ServerFixtures.create(server, `/api/tasks/${tasks.docs}/dependencies`, {
      dependsOnId: tasks.login,
    });
    await ServerFixtures.create(server, `/api/tasks/${tasks.docs}/dependencies`, {
      dependsOnId: tasks.refactor,
    });
    await ServerFixtures.create(server, `/api/tasks/${tasks.bug}/dependencies`, {
      dependsOnId: tasks.docs,
    });
    for (const content of ['First note', 'Second note', 'Third note']) {
      await ServerFixtures.create(server, `/api/tasks/${tasks.docs}/comments`, {
        author: 'tester',
        content,
      });
    }

    return { epics, tasks, subtasks };
  }

  private static withQuerySeparator(path: string): string {
    if (path.includes('?')) {
      return '&';
    }
    return '?';
  }

  static async collectPages<T>(server: ServeHandle, path: string): Promise<CollectedPages<T>> {
    const items: T[] = [];
    const totals: number[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      let suffix = '';
      if (cursor !== null) {
        suffix = `${ServerFixtures.withQuerySeparator(path)}cursor=${cursor}`;
      }
      const { status, body } = await server.json<Page<T>>(`${path}${suffix}`);
      if (status !== 200) {
        throw new Error(`GET ${path}${suffix} failed with ${status}: ${JSON.stringify(body)}`);
      }
      items.push(...body.items);
      totals.push(body.total);
      cursor = body.nextCursor;
      pages += 1;
    } while (cursor !== null && pages < 100);
    return { items, totals, pages };
  }
}

export interface Ref {
  id: string;
  title: string;
  status: string;
}

export interface Count {
  total: number;
  done: number;
}

export interface ItemSummary {
  kind: 'epic' | 'task' | 'subtask';
  id: string;
  title: string;
  status: string;
  priority: number;
  tags: string[];
  epic: Ref | null;
  parent: Ref | null;
  subtasks: Count;
  blockedBy: number;
  progress: Count | null;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface ApiError {
  error: ErrorBody;
}

export interface SeededProject {
  epics: Record<'alpha' | 'beta' | 'gamma', string>;
  tasks: Record<'docs' | 'login' | 'bug' | 'refactor' | 'zebra' | 'lower' | 'middle', string>;
  subtasks: Record<'one' | 'two' | 'three', string>;
}
