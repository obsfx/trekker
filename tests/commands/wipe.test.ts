import { describe, it, expect, afterEach } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

describe('wipe command', () => {
  let ctx: TestContext;

  afterEach(() => {
    ctx?.cleanup();
  });

  it('should delete .trekker directory with -y flag', () => {
    ctx = createTestContext();
    initTrekker(ctx);

    expect(ctx.exists('.trekker')).toBe(true);

    const output = ctx.run('wipe -y');
    expect(output).toContain('deleted successfully');
    expect(ctx.exists('.trekker')).toBe(false);
  });

  it('should fail if not initialized', () => {
    ctx = createTestContext();

    const error = ctx.runExpectError('wipe -y');
    expect(error).toContain('not initialized');
  });

  describe('interactive confirmation', () => {
    for (const answer of ['y', 'Y', 'yes', 'YES']) {
      it(`deletes data when confirmed with "${answer}"`, () => {
        ctx = createTestContext();
        initTrekker(ctx);

        const result = ctx.runRaw('wipe', { input: `${answer}\n` });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('Are you sure');
        expect(ctx.exists('.trekker')).toBe(false);
      });
    }

    for (const answer of ['n', 'no', '', 'maybe']) {
      it(`aborts when answered with "${answer}"`, () => {
        ctx = createTestContext();
        initTrekker(ctx);

        const result = ctx.runRaw('wipe', { input: `${answer}\n` });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('Aborted.');
        expect(ctx.exists('.trekker/trekker.db')).toBe(true);
      });
    }
  });
});
