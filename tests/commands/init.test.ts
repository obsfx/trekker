import { describe, it, expect, afterEach } from 'bun:test';
import { createTestContext, type TestContext } from '../helpers/test-context';

describe('init command', () => {
  let ctx: TestContext;

  afterEach(() => {
    ctx?.cleanup();
  });

  it('should create .trekker directory', () => {
    ctx = createTestContext();
    const output = ctx.run('init');

    expect(output).toContain('initialized successfully');
    expect(ctx.exists('.trekker')).toBe(true);
    expect(ctx.exists('.trekker/trekker.db')).toBe(true);
  });

  it('should fail if already initialized', () => {
    ctx = createTestContext();
    ctx.run('init');

    const error = ctx.runExpectError('init');
    expect(error).toContain('already initialized');
  });
});
