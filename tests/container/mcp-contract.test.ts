import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { decode } from '@toon-format/toon';
import { createTestContext, type TestContext } from '../helpers/test-context';
import { TestTarget } from '../helpers/workspace';

interface ToolOutcome {
  success: boolean;
  data?: string;
  error?: string;
}

interface ToolSpec {
  name: string;
  properties: string[];
}

class McpSession {
  private readonly client = new Client({ name: 'trekker-contract-test', version: '1.0.0' });
  private readonly usage = new Map<string, Set<string>>();

  async connect(containerId: string, cwd: string): Promise<void> {
    await this.client.connect(
      new StdioClientTransport({
        command: 'docker',
        args: ['exec', '-i', '-w', cwd, containerId, 'trekker-mcp'],
      })
    );
  }

  async tools(): Promise<ToolSpec[]> {
    const { tools } = await this.client.listTools();
    return tools.map((tool) => ({
      name: tool.name,
      properties: Object.keys(tool.inputSchema.properties ?? {}),
    }));
  }

  async callText(name: string, args: Record<string, unknown> = {}): Promise<string> {
    const used = this.usage.get(name) ?? new Set<string>();
    for (const key of Object.keys(args)) {
      used.add(key);
    }
    this.usage.set(name, used);

    const response = await this.client.callTool({ name, arguments: args });
    const parts: { text?: string }[] = [];
    if (Array.isArray(response.content)) {
      parts.push(...response.content);
    }
    return parts.map((part) => part.text ?? '').join('');
  }

  async call<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const outcome: ToolOutcome = JSON.parse(await this.callText(name, args));
    if (!outcome.success) {
      throw new Error(`${name} failed: ${outcome.error ?? 'unknown error'}`);
    }
    return JSON.parse(JSON.stringify(decode(outcome.data ?? '')));
  }

  unexercised(specs: ToolSpec[]): string[] {
    return specs.flatMap((spec) => {
      const used = this.usage.get(spec.name);
      if (!used) {
        return [spec.name];
      }
      return spec.properties
        .filter((property) => !used.has(property))
        .map((property) => `${spec.name}.${property}`);
    });
  }

  close(): Promise<void> {
    return this.client.close();
  }
}

describe.skipIf(!TestTarget.isContainer)('MCP server against the packaged CLI', () => {
  let ctx: TestContext;
  let mcp: McpSession;

  beforeAll(async () => {
    ctx = createTestContext();
    mcp = new McpSession();
    await mcp.connect(TestTarget.containerId, ctx.cwd);
  });

  afterAll(async () => {
    await mcp.close();
    ctx.cleanup();
  });

  it('drives the full lifecycle through every tool and argument', async () => {
    await mcp.call('trekker_init');
    expect(ctx.exists('.trekker/trekker.db')).toBe(true);
    expect(await mcp.callText('trekker_quickstart', { toon: true })).toContain('trekker');

    const epic = await mcp.call<{ id: string }>('trekker_epic_create', {
      title: 'MCP epic',
      description: 'Created through MCP',
      priority: 1,
    });
    const childEpic = await mcp.call<{ id: string }>('trekker_epic_create', {
      title: 'MCP child epic',
    });
    await mcp.call('trekker_epic_list', { status: 'todo', limit: 10, page: 1 });
    await mcp.call('trekker_epic_update', {
      epicId: epic.id,
      title: 'MCP epic renamed',
      description: 'Updated',
      priority: 0,
      status: 'in_progress',
    });
    expect(
      await mcp.call<{ title: string }>('trekker_epic_show', { epicId: epic.id })
    ).toMatchObject({ title: 'MCP epic renamed' });

    const task = await mcp.call<{ id: string }>('trekker_task_create', {
      title: 'MCP task',
      description: 'Task body',
      priority: 2,
      epicId: epic.id,
      tags: 'mcp,contract',
    });
    const blocker = await mcp.call<{ id: string }>('trekker_task_create', { title: 'MCP blocker' });
    const listed = await mcp.call<{ items: { id: string }[] }>('trekker_task_list', {
      status: 'todo',
      epicId: epic.id,
      limit: 10,
      page: 1,
    });
    expect(listed.items.map((item) => item.id)).toEqual([task.id]);

    await mcp.call('trekker_task_update', {
      taskId: task.id,
      title: 'MCP task renamed',
      description: 'New body',
      priority: 1,
      status: 'in_progress',
      epicId: childEpic.id,
      tags: 'updated',
    });
    await mcp.call('trekker_task_update', { taskId: task.id, removeEpic: true });
    expect(
      ctx.runToon<{ epicId: string | null; title: string }>(`task show ${task.id}`)
    ).toMatchObject({
      epicId: null,
      title: 'MCP task renamed',
    });
    await mcp.call('trekker_task_show', { taskId: task.id });

    const subtask = await mcp.call<{ id: string }>('trekker_subtask_create', {
      parentTaskId: task.id,
      title: 'MCP subtask',
      description: 'Sub body',
      priority: 3,
    });
    await mcp.call('trekker_subtask_list', { parentTaskId: task.id, limit: 10, page: 1 });
    await mcp.call('trekker_subtask_update', {
      subtaskId: subtask.id,
      title: 'MCP subtask renamed',
      description: 'Sub updated',
      priority: 4,
      status: 'completed',
    });

    const comment = await mcp.call<{ id: string }>('trekker_comment_add', {
      taskId: task.id,
      agent: 'mcp-agent',
      content: 'MCP comment',
    });
    await mcp.call('trekker_comment_list', { taskId: task.id, limit: 10, page: 1 });
    await mcp.call('trekker_comment_update', {
      commentId: comment.id,
      content: 'MCP comment edited',
    });

    await mcp.call('trekker_dep_add', { taskId: task.id, dependsOnTaskId: blocker.id });
    const deps = await mcp.call<{ dependsOn: { dependsOnId: string }[] }>('trekker_dep_list', {
      taskId: task.id,
    });
    expect(deps.dependsOn.map((dep) => dep.dependsOnId)).toEqual([blocker.id]);

    const ready = await mcp.call<{ items: { id: string }[] }>('trekker_task_ready', {
      limit: 10,
      page: 1,
    });
    expect(ready.items.map((item) => item.id)).toEqual([blocker.id]);

    const search = await mcp.call<{ results: { id: string }[] }>('trekker_search', {
      query: 'renamed',
      type: 'task,subtask',
      status: 'in_progress',
      limit: 10,
      page: 1,
      rebuildIndex: true,
    });
    expect(search.results.map((result) => result.id)).toEqual([task.id]);

    await mcp.call('trekker_dep_remove', { taskId: task.id, dependsOnTaskId: blocker.id });
    await mcp.call('trekker_comment_delete', { commentId: comment.id });
    await mcp.call('trekker_subtask_delete', { subtaskId: subtask.id });
    await mcp.call('trekker_task_delete', { taskId: task.id });
    await mcp.call('trekker_epic_delete', { epicId: childEpic.id });
    expect(ctx.query('SELECT id FROM tasks')).toEqual([{ id: blocker.id }]);
  });

  it('known drift: trekker_epic_create.parentEpicId maps to a flag the CLI does not have', async () => {
    await expect(
      mcp.call('trekker_epic_create', { title: 'Nested epic', parentEpicId: 'EPIC-1' })
    ).rejects.toThrow("unknown option '-e'");
  });

  it('wipes the project through MCP', async () => {
    await mcp.call('trekker_wipe', { confirm: true });
    expect(ctx.exists('.trekker')).toBe(false);
  });

  it('exercises every advertised tool and argument', async () => {
    expect(mcp.unexercised(await mcp.tools())).toEqual([]);
  });
});
