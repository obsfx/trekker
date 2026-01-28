import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import { createTestContext, type TestContext } from "../helpers/test-context";

describe("init command", () => {
  let ctx: TestContext;

  afterEach(() => {
    ctx?.cleanup();
  });

  it("should create .trekker directory", () => {
    ctx = createTestContext();
    const output = ctx.run("init");

    expect(output).toContain("initialized successfully");
    expect(existsSync(join(ctx.cwd, ".trekker"))).toBe(true);
    expect(existsSync(join(ctx.cwd, ".trekker", "trekker.db"))).toBe(true);
  });

  it("should fail if already initialized", () => {
    ctx = createTestContext();
    ctx.run("init");

    const error = ctx.runExpectError("init");
    expect(error).toContain("already initialized");
  });
});
