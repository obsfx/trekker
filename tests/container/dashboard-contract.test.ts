import dayjs from 'dayjs';
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { decode } from '@toon-format/toon';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { ContainerWorkspace, TestTarget } from '@/tests/helpers/workspace';
import type { Identified, ContentItem, SearchResults } from '@/tests/helpers/shapes';

interface StatusPriority {
  status: string;
  priority: number;
}

interface EventAction {
  action: string;
}

interface PrefixConfig {
  issue_prefix: string;
}

interface DependsOnList {
  dependsOn: unknown[];
}

interface CommentPage {
  items: ContentItem[];
}

interface EventPage {
  events: EventAction[];
}

abstract class DashboardContractFixture {
  static parseJson<T>(text: string): T {
    return JSON.parse(text);
  }
}

const DASHBOARD_PORT = 3000;
const PROJECT_DIR = '/work/project';
const SSE_TIMEOUT_MS = 15_000;
const CONCURRENT_WRITERS = 16;

interface ApiTask {
  id: string;
  title: string;
  status: string;
  epicId: string | null;
  parentTaskId: string | null;
  dependsOn: string[];
}

interface DashboardEvent {
  type: string;
  taskId?: string;
  epicId?: string;
}

class DashboardClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async send<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    return this.request<T>(method, path, body);
  }

  async raw(method: string, path: string, body?: unknown): Promise<Response> {
    const init: RequestInit = { method, headers: { 'content-type': 'application/json' } };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return fetch(`${this.baseUrl}${path}`, init);
  }

  async openEvents(): Promise<EventStream> {
    const controller = new AbortController();
    const response = await fetch(`${this.baseUrl}/api/events`, { signal: controller.signal });
    if (!response.body) {
      throw new Error('SSE response has no body');
    }
    return new EventStream(response.body.getReader(), controller);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.raw(method, path, body);
    if (!response.ok) {
      const failure = await response.text();
      throw new Error(`${method} ${path} -> ${response.status}: ${failure}`);
    }
    const payload = await response.text();
    return DashboardContractFixture.parseJson<T>(payload);
  }
}

class EventStream {
  private buffer = '';
  private readonly decoder = new TextDecoder();

  constructor(
    private readonly reader: ReadableStreamDefaultReader<Uint8Array>,
    private readonly controller: AbortController
  ) {}

  async waitFor(predicate: (event: DashboardEvent) => boolean): Promise<DashboardEvent> {
    const deadline = dayjs().valueOf() + SSE_TIMEOUT_MS;
    while (dayjs().valueOf() < deadline) {
      for (const event of this.drainEvents()) {
        if (predicate(event)) {
          return event;
        }
      }
      const chunk = await Promise.race([
        this.reader.read(),
        Bun.sleep(deadline - dayjs().valueOf()).then(() => {
          return null;
        }),
      ]);
      if (!chunk || chunk.done) {
        break;
      }
      this.buffer += this.decoder.decode(chunk.value, { stream: true });
    }
    throw new Error('Timed out waiting for dashboard event');
  }

  close(): void {
    this.controller.abort();
  }

  private drainEvents(): DashboardEvent[] {
    const frames = this.buffer.split('\n\n');
    this.buffer = frames.pop() ?? '';
    return frames.flatMap((frame) => {
      return frame
        .split('\n')
        .filter((line) => {
          return line.startsWith('data:') && line.slice('data:'.length).trim() !== '';
        })
        .map((line) => {
          return DashboardContractFixture.parseJson<DashboardEvent>(line.slice('data:'.length));
        });
    });
  }
}

describe.skipIf(!TestTarget.isContainer)('CLI and dashboard on a shared database', () => {
  let container: StartedTestContainer;
  let ctx: TestContext;
  let api: DashboardClient;

  beforeAll(async () => {
    container = await new GenericContainer(TestTarget.image)
      .withCommand([
        'sh',
        '-c',
        `mkdir -p ${PROJECT_DIR} && cd ${PROJECT_DIR} && trekker init && exec trekker-dashboard -p ${DASHBOARD_PORT}`,
      ])
      .withExposedPorts(DASHBOARD_PORT)
      .withWaitStrategy(Wait.forHttp('/api/project', DASHBOARD_PORT))
      .start();
    ctx = TestContexts.createTestContext(new ContainerWorkspace(container.getId(), PROJECT_DIR));
    api = new DashboardClient(
      `http://${container.getHost()}:${container.getMappedPort(DASHBOARD_PORT)}`
    );
  });

  afterAll(async () => {
    await container.stop();
  });

  it('serves entities written by the CLI', async () => {
    const epic = ctx.runToon<Identified>('epic create -t "CLI epic"').id;
    const task = ctx.runToon<Identified>(`task create -t "CLI task" -e ${epic}`).id;
    const blocker = ctx.runToon<Identified>('task create -t "CLI blocker"').id;
    ctx.run(`subtask create ${task} -t "CLI subtask"`);
    ctx.run(`comment add ${task} -a cli -c "CLI comment"`);
    ctx.run(`dep add ${task} ${blocker}`);

    const tasks = await api.get<ApiTask[]>('/api/tasks');
    const apiTask = tasks.find((candidate) => {
      return candidate.id === task;
    });
    expect(apiTask).toMatchObject({ title: 'CLI task', epicId: epic });
    expect(apiTask?.dependsOn).toEqual([blocker]);
    expect(
      tasks.filter((candidate) => {
        return candidate.parentTaskId === task;
      })
    ).toHaveLength(1);

    const comments = await api.get<ContentItem[]>(`/api/tasks/${task}/comments`);
    expect(
      comments.map((comment) => {
        return comment.content;
      })
    ).toEqual(['CLI comment']);

    const epics = await api.get<Identified[]>('/api/epics');
    expect(
      epics.map((candidate) => {
        return candidate.id;
      })
    ).toContain(epic);
  });

  it('exposes entities written by the dashboard to the CLI', async () => {
    const created = await api.send<ApiTask>('POST', '/api/tasks', {
      title: 'Dashboard task',
      priority: 1,
    });
    await api.send('PUT', `/api/tasks/${created.id}`, { status: 'in_progress' });
    await api.send('POST', `/api/tasks/${created.id}/comments`, {
      author: 'dashboard',
      content: 'Dashboard comment',
    });

    expect(ctx.runToon<StatusPriority>(`task show ${created.id}`)).toMatchObject({
      status: 'in_progress',
      priority: 1,
    });
    const comments = ctx.runToon<CommentPage>(`comment list ${created.id}`);
    expect(
      comments.items.map((comment) => {
        return comment.content;
      })
    ).toEqual(['Dashboard comment']);
  });

  it('records dashboard writes in CLI history and search', async () => {
    const created = await api.send<ApiTask>('POST', '/api/tasks', {
      title: 'Zeppelin maintenance',
    });
    await api.send('PUT', `/api/tasks/${created.id}`, { status: 'completed' });

    const history = ctx.runToon<EventPage>(`history --entity ${created.id}`);
    expect(
      history.events
        .map((event) => {
          return event.action;
        })
        .sort()
    ).toEqual(['create', 'update']);

    const search = ctx.runToon<SearchResults>('search zeppelin');
    expect(
      search.results.map((result) => {
        return result.id;
      })
    ).toEqual([created.id]);
  });

  it('shares ID counters between CLI and dashboard', async () => {
    const fromCli = ctx.runToon<Identified>('task create -t "Counter CLI"').id;
    const apiTask = await api.send<ApiTask>('POST', '/api/tasks', { title: 'Counter API' });
    const fromApi = apiTask.id;
    const next = ctx.runToon<Identified>('task create -t "Counter CLI 2"').id;

    const number = (id: string) => {
      return Number(id.split('-')[1]);
    };
    expect(number(fromApi)).toBe(number(fromCli) + 1);
    expect(number(next)).toBe(number(fromApi) + 1);
  });

  it('applies prefix changes made in the dashboard to CLI-created IDs', async () => {
    await api.send('PATCH', '/api/project/config', { issuePrefix: 'DASH' });
    try {
      expect(ctx.runToon<Identified>('task create -t "Prefixed"').id).toStartWith('DASH-');
      expect(ctx.runToon<PrefixConfig>('config list').issue_prefix).toBe('DASH');
    } finally {
      ctx.run('config unset issue_prefix');
    }
    const fromApi = await api.send<ApiTask>('POST', '/api/tasks', { title: 'Back to default' });
    expect(fromApi.id).toStartWith('TREK-');
  });

  it('cascades dashboard deletes without orphans visible to the CLI', async () => {
    const parent = ctx.runToon<Identified>('task create -t "Delete via API"').id;
    const dependent = ctx.runToon<Identified>('task create -t "Dependent"').id;
    ctx.run(`subtask create ${parent} -t "Child"`);
    ctx.run(`comment add ${parent} -a cli -c "Gone"`);
    ctx.run(`dep add ${dependent} ${parent}`);

    await api.send('DELETE', `/api/tasks/${parent}`);

    expect(ctx.runExpectError(`task show ${parent}`)).toContain('not found');
    expect(ctx.runToon<DependsOnList>(`dep list ${dependent}`).dependsOn).toEqual([]);
    expect(ctx.query('PRAGMA foreign_key_check')).toEqual([]);
    expect(
      ctx.query(
        'SELECT id FROM tasks WHERE parent_task_id IS NOT NULL AND parent_task_id NOT IN (SELECT id FROM tasks)'
      )
    ).toEqual([]);
  });

  it('dashboard rejects dependencies the CLI would reject', async () => {
    const first = ctx.runToon<Identified>('task create -t "Cycle A"').id;
    const second = ctx.runToon<Identified>('task create -t "Cycle B"').id;
    ctx.run(`dep add ${second} ${first}`);

    const cycle = await api.raw('POST', '/api/dependencies', {
      taskId: first,
      dependsOnId: second,
    });
    expect(cycle.status).toBe(400);
    expect(ctx.runExpectError(`dep add ${first} ${second}`).toLowerCase()).toContain('cycl');
  });

  it('streams CLI changes to dashboard SSE subscribers', async () => {
    const events = await api.openEvents();
    try {
      await events.waitFor((event) => {
        return event.type === 'connected';
      });
      const created = ctx.runToon<Identified>('task create -t "Live task"').id;
      await events.waitFor((event) => {
        return event.type === 'task_created' && event.taskId === created;
      });

      ctx.run(`task update ${created} -s completed`);
      await events.waitFor((event) => {
        return event.type === 'task_updated' && event.taskId === created;
      });

      ctx.run(`task delete ${created}`);
      await events.waitFor((event) => {
        return event.type === 'task_deleted' && event.taskId === created;
      });
    } finally {
      events.close();
    }
  });

  it('handles concurrent CLI and dashboard writers without lock errors or ID collisions', async () => {
    const cliWrites = Array.from({ length: CONCURRENT_WRITERS }, (_, index) => {
      return ctx.workspace.trekkerAsync([
        '--toon',
        'task',
        'create',
        '-t',
        `Concurrent CLI ${index}`,
      ]);
    });
    const apiWrites = Array.from({ length: CONCURRENT_WRITERS }, (_, index) => {
      return api.raw('POST', '/api/tasks', { title: `Concurrent API ${index}` });
    });

    const cliResults = await Promise.all(cliWrites);
    const apiResults = await Promise.all(apiWrites);

    const cliFailures = cliResults
      .filter((result) => {
        return result.status !== 0;
      })
      .map((result) => {
        return result.stderr;
      });
    const apiFailures = await Promise.all(
      apiResults
        .filter((response) => {
          return !response.ok;
        })
        .map((response) => {
          return response.text();
        })
    );
    expect(cliFailures).toEqual([]);
    expect(apiFailures).toEqual([]);

    const cliIds = cliResults.map((result) => {
      return DashboardContractFixture.parseJson<Identified>(JSON.stringify(decode(result.stdout)))
        .id;
    });
    const apiIds = await Promise.all(
      apiResults.map(async (response) => {
        const body = await response.text();
        return DashboardContractFixture.parseJson<Identified>(body).id;
      })
    );
    const ids = [...cliIds, ...apiIds];
    expect(new Set(ids).size).toBe(CONCURRENT_WRITERS * 2);

    const stored = ctx.query("SELECT COUNT(*) AS count FROM tasks WHERE title LIKE 'Concurrent %'");
    expect(stored).toEqual([{ count: CONCURRENT_WRITERS * 2 }]);
  });
});
