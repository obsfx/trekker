import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { TestTarget } from '@/tests/helpers/workspace';
import { PREVIOUS_TREKKER_VERSIONS, ReleaseMatrix } from '@/tests/container/release-matrix';
import type { ContentItem, Identified, SearchResults } from '@/tests/helpers/shapes';

interface Titled {
  title: string;
}

interface DependsOnRef {
  dependsOnId: string;
}

interface EntityEvent {
  entityId: string;
  action: string;
}

interface DependsOnRefs {
  dependsOn: DependsOnRef[];
}

interface EntityEventPage {
  events: EntityEvent[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  tags: string | null;
  epicId: string | null;
  parentTaskId: string | null;
}

interface Paginated<T> {
  total: number;
  items: T[];
}

const LEGACY_SETUP = [
  ['init'],
  ['epic', 'create', '-t', 'Legacy epic', '-d', 'Created before the upgrade'],
  [
    'task',
    'create',
    '-t',
    'Legacy task',
    '-d',
    'Searchable legacy text',
    '-e',
    'EPIC-1',
    '-p',
    '1',
    '--tags',
    'old,kept',
  ],
  ['subtask', 'create', 'TREK-1', '-t', 'Legacy subtask'],
  ['comment', 'add', 'TREK-1', '-a', 'legacy', '-c', 'Legacy comment body'],
  ['task', 'create', '-t', 'Dependent task'],
  ['dep', 'add', 'TREK-3', 'TREK-1'],
  ['task', 'update', 'TREK-3', '-s', 'in_progress'],
];

describe.skipIf(!TestTarget.isContainer)('upgrade from published releases', () => {
  for (const version of PREVIOUS_TREKKER_VERSIONS) {
    describe(`from ${version}`, () => {
      let ctx: TestContext;

      beforeAll(() => {
        ctx = TestContexts.createTestContext();
        for (const args of LEGACY_SETUP) {
          const result = ctx.workspace.exec([ReleaseMatrix.previousTrekkerBin(version), ...args]);
          if (result.status !== 0) {
            throw new Error(
              `${version} ${args.join(' ')} failed: ${result.stderr || result.stdout}`
            );
          }
        }
      });

      afterAll(() => {
        ctx.cleanup();
      });

      it('reads legacy data unchanged', () => {
        const task = ctx.runToon<Task>('task show TREK-1');
        expect(task).toMatchObject({
          title: 'Legacy task',
          description: 'Searchable legacy text',
          priority: 1,
          tags: 'old,kept',
          epicId: 'EPIC-1',
          status: 'todo',
        });
        expect(ctx.runToon<Titled>('epic show EPIC-1').title).toBe('Legacy epic');
        expect(ctx.runToon<Task>('task show TREK-3').status).toBe('in_progress');

        const subtasks = ctx.runToon<Paginated<Task>>('subtask list TREK-1');
        expect(
          subtasks.items.map((subtask) => {
            return subtask.title;
          })
        ).toEqual(['Legacy subtask']);

        const comments = ctx.runToon<Paginated<ContentItem>>('comment list TREK-1');
        expect(
          comments.items.map((comment) => {
            return comment.content;
          })
        ).toEqual(['Legacy comment body']);

        const deps = ctx.runToon<DependsOnRefs>('dep list TREK-3');
        expect(
          deps.dependsOn.map((dep) => {
            return dep.dependsOnId;
          })
        ).toEqual(['TREK-1']);
      });

      it('migrates config with default prefixes', () => {
        expect(ctx.runToon<Record<string, string>>('config list')).toEqual({
          issue_prefix: 'TREK',
          epic_prefix: 'EPIC',
          comment_prefix: 'CMT',
        });
      });

      it('indexes legacy content for search', () => {
        const results = ctx.runToon<SearchResults>('search legacy');
        expect(
          results.results.map((result) => {
            return result.id;
          })
        ).toEqual(expect.arrayContaining(['EPIC-1', 'TREK-1', 'TREK-2']));
      });

      it('continues ID counters without collisions', () => {
        expect(ctx.runToon<Task>('task create -t "After upgrade"').id).toBe('TREK-4');
        expect(ctx.runToon<Identified>('epic create -t "After upgrade"').id).toBe('EPIC-2');
        expect(ctx.runToon<Identified>('comment add TREK-1 -a new -c "After"').id).toBe('CMT-2');
      });

      it('records history for changes made after the upgrade', () => {
        ctx.run('task update TREK-1 -s completed');
        const history = ctx.runToon<EntityEventPage>('history --entity TREK-1 --action update');
        expect(history.events.length).toBeGreaterThan(0);
      });

      it('applies dependency rules to legacy rows', () => {
        const readyIds = () => {
          return ctx.runToon<Paginated<Task>>('ready').items.map((task) => {
            return task.id;
          });
        };
        ctx.run('task update TREK-3 -s todo');

        ctx.run('task update TREK-1 -s todo');
        expect(readyIds()).not.toContain('TREK-3');

        ctx.run('task update TREK-1 -s completed');
        expect(readyIds()).toContain('TREK-3');
      });

      it('cascades deletes on the migrated schema', () => {
        ctx.run('task delete TREK-1');
        expect(ctx.query("SELECT id FROM tasks WHERE id IN ('TREK-1', 'TREK-2')")).toEqual([]);
        expect(ctx.query("SELECT id FROM comments WHERE task_id = 'TREK-1'")).toEqual([]);
        expect(
          ctx.query("SELECT task_id FROM dependencies WHERE depends_on_id = 'TREK-1'")
        ).toEqual([]);
        expect(ctx.query('PRAGMA foreign_key_check')).toEqual([]);
      });
    });
  }
});
