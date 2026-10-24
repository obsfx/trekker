import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { realpathSync } from 'node:fs';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { TestTarget } from '@/tests/helpers/workspace';
import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import {
  type ApiError,
  type ItemSummary,
  type Page,
  type Ref,
  type SeededProject,
  ServerFixtures,
} from '@/tests/server/fixtures';
import type { FieldChange, EntityCounts } from '@/src/types';
import type { Identified } from '@/tests/helpers/shapes';

interface Prioritized {
  priority: number;
}

interface Snippeted {
  snippet: string | null;
}

interface ArchiveTotals {
  tasks: number;
  epics: number;
}

interface TaskDetail extends ItemSummary {
  description: string | null;
  subtaskList: (Ref & Prioritized)[];
  dependsOn: Ref[];
  blocks: Ref[];
}

interface EpicDetail extends ItemSummary {
  description: string | null;
  statusCounts: Record<string, number>;
}

interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface HistoryEvent {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  taskId: string | null;
  title: string | null;
  relatedIds: string[];
  snapshot: Record<string, unknown> | null;
  changes: Record<string, FieldChange> | null;
  createdAt: number;
}

interface Project {
  name: string;
  root: string;
  version: string;
  config: Record<string, string>;
  counts: EntityCounts;
}

describe.skipIf(TestTarget.isContainer)('trekker serve REST API', () => {
  let ctx: TestContext;
  let server: ServeHandle;
  let seed: SeededProject;

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
    seed = await ServerFixtures.seedProject(server);
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  async function expectError(
    path: string,
    init: RequestInit | undefined,
    status: number,
    code: string
  ): Promise<string> {
    const response = await server.json<ApiError>(path, init);
    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(code);
    return response.body.error.message;
  }

  describe('project', () => {
    it('describes the project with config and counts', async () => {
      const { status, body } = await server.json<Project>('/api/project');
      expect(status).toBe(200);
      expect(body.root).toBe(realpathSync(ctx.cwd));
      expect(body.name.length).toBeGreaterThan(0);
      expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(body.config).toEqual({
        issue_prefix: 'TREK',
        epic_prefix: 'EPIC',
        comment_prefix: 'CMT',
      });
      expect(body.counts).toEqual({ epics: 3, tasks: 7, subtasks: 3 });
    });

    it('updates config with the CLI validation rules', async () => {
      const updated = await server.json<Project>(
        '/api/project/config',
        ServeHelpers.jsonInit('PATCH', { comment_prefix: 'note' })
      );
      expect(updated.status).toBe(200);
      expect(updated.body.config.comment_prefix).toBe('NOTE');

      await expectError(
        '/api/project/config',
        ServeHelpers.jsonInit('PATCH', { epic_prefix: 'TREK' }),
        409,
        'conflict'
      );
      await expectError(
        '/api/project/config',
        ServeHelpers.jsonInit('PATCH', { epic_prefix: '1X' }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/project/config',
        ServeHelpers.jsonInit('PATCH', { color: 'red' }),
        400,
        'invalid_request'
      );

      await server.json(
        '/api/project/config',
        ServeHelpers.jsonInit('PATCH', { comment_prefix: 'CMT' })
      );
    });
  });

  describe('task detail', () => {
    it('returns subtasks, dependencies and description', async () => {
      const { status, body } = await server.json<TaskDetail>(`/api/tasks/${seed.tasks.docs}`);
      expect(status).toBe(200);
      expect(body.kind).toBe('task');
      expect(body.description).toBe('Document the retry behaviour');
      expect(
        body.subtaskList.map((subtask) => {
          return subtask.id;
        })
      ).toEqual([seed.subtasks.one, seed.subtasks.two]);
      expect(body.subtaskList[0]).toEqual({
        id: seed.subtasks.one,
        title: 'Sub one',
        status: 'completed',
        priority: 2,
      });
      expect(
        body.dependsOn.map((ref) => {
          return ref.id;
        })
      ).toEqual([seed.tasks.login, seed.tasks.refactor]);
      expect(body.blocks).toEqual([{ id: seed.tasks.bug, title: 'Fix bug', status: 'todo' }]);
      expect(body.blockedBy).toBe(1);
    });

    it('works for subtasks', async () => {
      const { body } = await server.json<TaskDetail>(`/api/tasks/${seed.subtasks.three}`);
      expect(body.kind).toBe('subtask');
      expect(body.parent?.id).toBe(seed.tasks.bug);
      expect(body.epic?.id).toBe(seed.epics.beta);
    });

    it('returns 404 for epics and unknown ids', async () => {
      await expectError(`/api/tasks/${seed.epics.alpha}`, undefined, 404, 'not_found');
      await expectError('/api/tasks/TREK-999', undefined, 404, 'not_found');
    });
  });

  describe('epic detail', () => {
    it('returns status counts and progress', async () => {
      const { status, body } = await server.json<EpicDetail>(`/api/epics/${seed.epics.alpha}`);
      expect(status).toBe(200);
      expect(body.kind).toBe('epic');
      expect(body.progress).toEqual({ total: 2, done: 0 });
      expect(body.statusCounts).toEqual({
        todo: 1,
        in_progress: 1,
        completed: 0,
        wont_fix: 0,
        archived: 0,
      });
      await expectError(`/api/epics/${seed.tasks.docs}`, undefined, 404, 'not_found');
    });

    it('pages the tasks of an epic', async () => {
      const { items, totals } = await ServerFixtures.collectPages<ItemSummary>(
        server,
        `/api/epics/${seed.epics.alpha}/tasks?sort=title:asc&limit=1`
      );
      expect(
        items.map((item) => {
          return item.title;
        })
      ).toEqual(['Add login', 'Write docs']);
      expect(totals).toEqual([2, 2]);

      const filtered = await server.json<Page<ItemSummary>>(
        `/api/epics/${seed.epics.alpha}/tasks?status=in_progress`
      );
      expect(
        filtered.body.items.map((item) => {
          return item.id;
        })
      ).toEqual([seed.tasks.login]);
      await expectError('/api/epics/EPIC-999/tasks', undefined, 404, 'not_found');
    });
  });

  describe('task writes', () => {
    it('creates, updates and deletes a task', async () => {
      const created = await server.json<TaskDetail>(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', {
          title: '  New task  ',
          description: 'Body',
          priority: 1,
          status: 'in_progress',
          epicId: seed.epics.beta,
          tags: ['ui', ' api '],
        })
      );
      expect(created.status).toBe(201);
      expect(created.body.title).toBe('New task');
      expect(created.body.tags).toEqual(['ui', 'api']);
      expect(created.body.epic?.id).toBe(seed.epics.beta);
      const id = created.body.id;

      const updated = await server.json<TaskDetail>(
        `/api/tasks/${id}`,
        ServeHelpers.jsonInit('PATCH', {
          epicId: null,
          tags: [],
          description: null,
          status: 'completed',
        })
      );
      expect(updated.status).toBe(200);
      expect(updated.body.epic).toBeNull();
      expect(updated.body.tags).toEqual([]);
      expect(updated.body.description).toBeNull();
      expect(updated.body.status).toBe('completed');

      const deleted = await server.request(`/api/tasks/${id}`, { method: 'DELETE' });
      expect(deleted.status).toBe(204);
      await expectError(`/api/tasks/${id}`, undefined, 404, 'not_found');
      await expectError(`/api/tasks/${id}`, { method: 'DELETE' }, 404, 'not_found');
    });

    it('creates subtasks inside the parent epic', async () => {
      const created = await server.json<TaskDetail>(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'Nested', parentTaskId: seed.tasks.login })
      );
      expect(created.status).toBe(201);
      expect(created.body.kind).toBe('subtask');
      expect(created.body.epic?.id).toBe(seed.epics.alpha);
      await server.request(`/api/tasks/${created.body.id}`, { method: 'DELETE' });
    });

    it('validates task bodies', async () => {
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: '   ' }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', priority: 7 }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', status: 'done' }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', tags: ['a,b'] }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', extra: 1 }),
        400,
        'invalid_request'
      );
      await expectError('/api/tasks', { method: 'POST', body: '{nope' }, 400, 'invalid_request');
      await expectError(
        `/api/tasks/${seed.tasks.zebra}`,
        ServeHelpers.jsonInit('PATCH', {}),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', epicId: 'EPIC-404' }),
        404,
        'not_found'
      );
      await expectError(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'x', parentTaskId: 'TREK-404' }),
        404,
        'not_found'
      );
      await expectError(
        '/api/tasks/TREK-404',
        ServeHelpers.jsonInit('PATCH', { title: 'x' }),
        404,
        'not_found'
      );
    });
  });

  describe('epic writes', () => {
    it('creates, updates and deletes an epic', async () => {
      const created = await server.json<EpicDetail>(
        '/api/epics',
        ServeHelpers.jsonInit('POST', { title: 'Temporary epic', status: 'in_progress' })
      );
      expect(created.status).toBe(201);
      expect(created.body.progress).toEqual({ total: 0, done: 0 });

      const updated = await server.json<EpicDetail>(
        `/api/epics/${created.body.id}`,
        ServeHelpers.jsonInit('PATCH', { title: 'Renamed epic', priority: 0 })
      );
      expect(updated.body.title).toBe('Renamed epic');
      expect(updated.body.priority).toBe(0);

      await expectError(
        `/api/epics/${created.body.id}`,
        ServeHelpers.jsonInit('PATCH', { status: 'wont_fix' }),
        400,
        'invalid_request'
      );

      const deleted = await server.request(`/api/epics/${created.body.id}`, { method: 'DELETE' });
      expect(deleted.status).toBe(204);
      await expectError(`/api/epics/${created.body.id}`, undefined, 404, 'not_found');
    });
  });

  describe('comments', () => {
    it('pages comments oldest first', async () => {
      const { items, totals, pages } = await ServerFixtures.collectPages<Comment>(
        server,
        `/api/tasks/${seed.tasks.docs}/comments?limit=2`
      );
      expect(pages).toBe(2);
      expect(
        items.map((comment) => {
          return comment.content;
        })
      ).toEqual(['First note', 'Second note', 'Third note']);
      expect(totals).toEqual([3, 3]);
      expect(items[0].taskId).toBe(seed.tasks.docs);
    });

    it('creates, edits and deletes a comment', async () => {
      const created = await server.json<Comment>(
        `/api/tasks/${seed.tasks.zebra}/comments`,
        ServeHelpers.jsonInit('POST', { author: 'agent', content: 'Looks good' })
      );
      expect(created.status).toBe(201);
      expect(created.body.author).toBe('agent');

      const edited = await server.json<Comment>(
        `/api/comments/${created.body.id}`,
        ServeHelpers.jsonInit('PATCH', { content: 'Edited' })
      );
      expect(edited.status).toBe(200);
      expect(edited.body.content).toBe('Edited');

      const deleted = await server.request(`/api/comments/${created.body.id}`, {
        method: 'DELETE',
      });
      expect(deleted.status).toBe(204);
      await expectError(`/api/comments/${created.body.id}`, { method: 'DELETE' }, 404, 'not_found');
    });

    it('validates comments', async () => {
      await expectError(
        `/api/tasks/${seed.tasks.zebra}/comments`,
        ServeHelpers.jsonInit('POST', { author: 'a', content: '  ' }),
        400,
        'invalid_request'
      );
      await expectError(
        `/api/tasks/${seed.tasks.zebra}/comments`,
        ServeHelpers.jsonInit('POST', { content: 'x' }),
        400,
        'invalid_request'
      );
      await expectError(
        '/api/tasks/TREK-404/comments',
        ServeHelpers.jsonInit('POST', { author: 'a', content: 'x' }),
        404,
        'not_found'
      );
      await expectError('/api/tasks/TREK-404/comments', undefined, 404, 'not_found');
    });
  });

  describe('dependencies', () => {
    it('adds and removes a dependency', async () => {
      const added = await server.json<TaskDetail>(
        `/api/tasks/${seed.tasks.zebra}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.login })
      );
      expect(added.status).toBe(201);
      expect(
        added.body.dependsOn.map((ref) => {
          return ref.id;
        })
      ).toEqual([seed.tasks.login]);
      expect(added.body.blockedBy).toBe(1);

      const removed = await server.json<TaskDetail>(
        `/api/tasks/${seed.tasks.zebra}/dependencies/${seed.tasks.login}`,
        { method: 'DELETE' }
      );
      expect(removed.status).toBe(200);
      expect(removed.body.dependsOn).toEqual([]);
    });

    it('maps dependency rule violations', async () => {
      await expectError(
        `/api/tasks/${seed.tasks.login}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.bug }),
        409,
        'conflict'
      );
      await expectError(
        `/api/tasks/${seed.tasks.docs}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.login }),
        409,
        'conflict'
      );
      await expectError(
        `/api/tasks/${seed.tasks.docs}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.docs }),
        400,
        'invalid_request'
      );
      await expectError(
        `/api/tasks/${seed.tasks.docs}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: 'TREK-404' }),
        404,
        'not_found'
      );
      await expectError(
        `/api/tasks/${seed.tasks.zebra}/dependencies/${seed.tasks.login}`,
        { method: 'DELETE' },
        404,
        'not_found'
      );
    });
  });

  describe('search', () => {
    it('returns item summaries with snippets', async () => {
      const { status, body } =
        await server.json<Page<ItemSummary & Snippeted>>('/api/search?q=retry');
      expect(status).toBe(200);
      expect(body.total).toBe(1);
      expect(body.items[0].id).toBe(seed.tasks.docs);
      expect(body.items[0].snippet).toContain('**retry**');
      expect(body.items[0].commentCount).toBe(3);
    });

    it('pages search results and keeps the FTS fallback', async () => {
      const { items, totals } = await ServerFixtures.collectPages<ItemSummary>(
        server,
        '/api/search?q=epic&limit=2'
      );
      expect(
        items
          .map((item) => {
            return item.kind;
          })
          .every((kind) => {
            return kind === 'epic';
          })
      ).toBe(true);
      expect(items).toHaveLength(3);
      expect(totals[0]).toBe(3);

      const fallback = await server.json<Page<ItemSummary>>('/api/search?q=%22unterminated');
      expect(fallback.status).toBe(200);

      const typed = await server.json<Page<ItemSummary>>(
        '/api/search?q=sub&type=subtask&status=todo'
      );
      expect(
        typed.body.items
          .map((item) => {
            return item.id;
          })
          .sort()
      ).toEqual([seed.subtasks.two, seed.subtasks.three].sort());
      await expectError('/api/search', undefined, 400, 'invalid_request');
      await expectError('/api/search?q=x&type=comment', undefined, 400, 'invalid_request');
    });
  });

  describe('history', () => {
    it('pages history newest first with keyset cursors', async () => {
      const full = await server.json<Page<HistoryEvent>>('/api/history?limit=200');
      const { items, totals } = await ServerFixtures.collectPages<HistoryEvent>(
        server,
        '/api/history?limit=7'
      );
      const ids = items.map((event) => {
        return event.id;
      });

      expect(ids).toEqual(
        full.body.items.map((event) => {
          return event.id;
        })
      );
      expect(ids).toEqual(
        [...ids].sort((a, b) => {
          return b - a;
        })
      );
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(totals)).toEqual(new Set([full.body.total]));
      expect(items[0].createdAt).toBeGreaterThan(1_000_000_000_000);
    });

    it('filters history by type, action and entity', async () => {
      const comments = await server.json<Page<HistoryEvent>>(
        '/api/history?type=comment&action=create'
      );
      expect(
        comments.body.items.every((event) => {
          return event.entityType === 'comment' && event.action === 'create';
        })
      ).toBe(true);
      expect(comments.body.total).toBeGreaterThanOrEqual(3);

      const entity = await server.json<Page<HistoryEvent>>(
        `/api/history?entity=${seed.tasks.docs}`
      );
      expect(
        entity.body.items.every((event) => {
          return event.entityId === seed.tasks.docs || event.taskId === seed.tasks.docs;
        })
      ).toBe(true);
      expect(entity.body.items.at(-1)?.action).toBe('create');
      expect(entity.body.items.at(-1)?.snapshot?.title).toBe('Write docs');

      await expectError('/api/history?type=project', undefined, 400, 'invalid_request');
      await expectError('/api/history?cursor=eyJ4IjoxfQ', undefined, 400, 'invalid_request');
    });
  });

  describe('history context', () => {
    it('names the owning task and its title for every entity type', async () => {
      const comment = await server.json<Comment>(
        `/api/tasks/${seed.tasks.zebra}/comments`,
        ServeHelpers.jsonInit('POST', { author: 'agent', content: 'Context check' })
      );
      await server.json(
        `/api/comments/${comment.body.id}`,
        ServeHelpers.jsonInit('PATCH', { content: 'Edited context' })
      );
      await server.json(
        `/api/tasks/${seed.tasks.zebra}/dependencies`,
        ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.bug })
      );
      const doomed = await server.json<Identified>(
        '/api/tasks',
        ServeHelpers.jsonInit('POST', { title: 'Doomed' })
      );
      await server.request(`/api/tasks/${doomed.body.id}`, { method: 'DELETE' });

      const { body } = await server.json<Page<HistoryEvent>>('/api/history?limit=10');
      const find = (predicate: (event: HistoryEvent) => boolean): HistoryEvent | undefined => {
        return body.items.find(predicate);
      };

      const commentCreate = find((event) => {
        return event.entityType === 'comment' && event.action === 'create';
      });
      expect(commentCreate?.taskId).toBe(seed.tasks.zebra);
      expect(commentCreate?.title).toBe('Zebra task');
      expect(commentCreate?.snapshot?.taskId).toBe(seed.tasks.zebra);

      const commentUpdate = find((event) => {
        return event.entityType === 'comment' && event.action === 'update';
      });
      expect(commentUpdate?.snapshot).toBeNull();
      expect(commentUpdate?.taskId).toBe(seed.tasks.zebra);
      expect(commentUpdate?.changes?.content?.to).toBe('Edited context');

      const dependency = find((event) => {
        return event.entityType === 'dependency';
      });
      expect(dependency?.taskId).toBe(seed.tasks.zebra);
      expect(dependency?.snapshot?.dependsOnId).toBe(seed.tasks.bug);

      const deleted = find((event) => {
        return event.action === 'delete' && event.entityId === doomed.body.id;
      });
      expect(deleted?.taskId).toBe(doomed.body.id);
      expect(deleted?.title).toBe('Doomed');
      expect(deleted?.snapshot?.parentTaskId).toBeNull();

      const epicEvents = await server.json<Page<HistoryEvent>>(
        `/api/history?entity=${seed.epics.alpha}`
      );
      expect(epicEvents.body.items[0].taskId).toBeNull();
      expect(epicEvents.body.items[0].title).toBe('Alpha epic');

      await server.request(`/api/tasks/${seed.tasks.zebra}/dependencies/${seed.tasks.bug}`, {
        method: 'DELETE',
      });
    });
  });

  describe('items by id', () => {
    it('returns the requested rows from both tables in one page', async () => {
      const wanted = [seed.subtasks.one, seed.epics.beta, seed.tasks.zebra, 'TREK-404'];
      const { status, body } = await server.json<Page<ItemSummary>>(
        `/api/items?ids=${wanted.join(',')}&sort=title:asc&cursor=ignored`
      );
      expect(status).toBe(200);
      expect(
        body.items.map((item) => {
          return item.id;
        })
      ).toEqual([seed.subtasks.one, seed.tasks.zebra, seed.epics.beta]);
      expect(body.nextCursor).toBeNull();
      expect(body.total).toBe(3);
      expect(body.items[0].parent?.id).toBe(seed.tasks.docs);

      const filtered = await server.json<Page<ItemSummary>>(
        `/api/items?ids=${wanted.join(',')}&type=epic`
      );
      expect(
        filtered.body.items.map((item) => {
          return item.id;
        })
      ).toEqual([seed.epics.beta]);

      const tooMany = Array.from({ length: 201 }, (_, index) => {
        return `TREK-${index + 1}`;
      }).join(',');
      await expectError(`/api/items?ids=${tooMany}`, undefined, 400, 'invalid_request');
    });
  });

  describe('archive completed', () => {
    it('archives completed tasks and epics', async () => {
      const { status, body } = await server.json<ArchiveTotals>('/api/archive-completed', {
        method: 'POST',
      });
      expect(status).toBe(200);
      expect(body).toEqual({ tasks: 2, epics: 1 });

      const archived = await server.json<Page<ItemSummary>>('/api/items?status=completed');
      expect(archived.body.total).toBe(0);
      const docs = await server.json<TaskDetail>(`/api/tasks/${seed.tasks.docs}`);
      expect(docs.body.subtasks).toEqual({ total: 2, done: 1 });
    });
  });

  it('answers unknown API routes with a JSON 404', async () => {
    await expectError('/api/unknown', undefined, 404, 'not_found');
    await expectError(`/api/tasks/${seed.tasks.docs}`, { method: 'PUT' }, 404, 'not_found');
  });
});

describe.skipIf(TestTarget.isContainer)('trekker serve history relations', () => {
  let ctx: TestContext;
  let server: ServeHandle;
  let seed: SeededProject;

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
    seed = await ServerFixtures.seedProject(server);
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  const latestFor = async (id: string): Promise<HistoryEvent | undefined> => {
    const { body } = await server.json<Page<HistoryEvent>>('/api/history?limit=20');
    return body.items.find((event) => {
      return event.entityId === id;
    });
  };

  it('names the parent and epic of a changed subtask', async () => {
    await server.json(
      `/api/tasks/${seed.subtasks.one}`,
      ServeHelpers.jsonInit('PATCH', { status: 'in_progress' })
    );
    const event = await latestFor(seed.subtasks.one);
    expect(event?.relatedIds).toContain(seed.tasks.docs);
    expect(event?.relatedIds).toContain(seed.epics.alpha);
  });

  it('names the tasks blocked by a changed task', async () => {
    await server.json(
      `/api/tasks/${seed.tasks.login}/dependencies`,
      ServeHelpers.jsonInit('POST', { dependsOnId: seed.tasks.refactor })
    );
    await server.json(
      `/api/tasks/${seed.tasks.refactor}`,
      ServeHelpers.jsonInit('PATCH', { title: 'Refactor with a dependent' })
    );
    const latest = await latestFor(seed.tasks.refactor);
    expect(latest?.relatedIds).toContain(seed.tasks.login);
    await server.request(`/api/tasks/${seed.tasks.login}/dependencies/${seed.tasks.refactor}`, {
      method: 'DELETE',
    });
  });

  it('includes comments and links of a task in its activity', async () => {
    await server.json(
      `/api/tasks/${seed.tasks.docs}/comments`,
      ServeHelpers.jsonInit('POST', { author: 'agent', content: 'Activity check' })
    );
    const { body } = await server.json<Page<HistoryEvent>>(
      `/api/history?entity=${seed.tasks.docs}`
    );
    expect(
      body.items.some((event) => {
        return event.entityType === 'comment';
      })
    ).toBe(true);
    expect(
      body.items.every((event) => {
        return event.entityId === seed.tasks.docs || event.taskId === seed.tasks.docs;
      })
    ).toBe(true);
  });
});
