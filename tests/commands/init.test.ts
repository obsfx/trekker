import { describe, it, expect, afterEach } from 'bun:test';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';

describe('init command', () => {
  let ctx: TestContext;

  afterEach(() => {
    ctx?.cleanup();
  });

  it('should create .trekker directory', () => {
    ctx = TestContexts.createTestContext();
    const output = ctx.run('init');

    expect(output).toContain('initialized successfully');
    expect(ctx.exists('.trekker')).toBe(true);
    expect(ctx.exists('.trekker/trekker.db')).toBe(true);
  });

  it('should fail if already initialized', () => {
    ctx = TestContexts.createTestContext();
    ctx.run('init');

    const error = ctx.runExpectError('init');
    expect(error).toContain('already initialized');
  });
});
