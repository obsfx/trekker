import { describe, it, expect, afterEach } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

describe("wipe command", () => {
  let ctx: TestContext;

  afterEach(() => {
    ctx?.cleanup();
  });

  it("should delete .trekker directory with -y flag", () => {
    ctx = createTestContext();
    initTrekker(ctx);

    expect(existsSync(join(ctx.cwd, ".trekker"))).toBe(true);

    const output = ctx.run("wipe -y");
    expect(output).toContain("deleted successfully");
    expect(existsSync(join(ctx.cwd, ".trekker"))).toBe(false);
  });

  it("should fail if not initialized", () => {
    ctx = createTestContext();

    const error = ctx.runExpectError("wipe -y");
    expect(error).toContain("not initialized");
  });
});
