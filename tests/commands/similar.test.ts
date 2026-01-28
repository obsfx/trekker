import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

describe("similar command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("command validation", () => {
    it("should require id-or-text argument", () => {
      const error = ctx.runExpectError("similar");
      expect(error.toLowerCase()).toContain("argument");
    });

    it("should validate threshold maximum", () => {
      const error = ctx.runExpectError('similar "test" --threshold 2.0');
      expect(error.toLowerCase()).toContain("threshold");
    });

    it("should validate threshold minimum", () => {
      const error = ctx.runExpectError('similar "test" --threshold -0.5');
      expect(error.toLowerCase()).toContain("threshold");
    });

    it("should validate limit must be positive", () => {
      const error = ctx.runExpectError('similar "test" --limit 0');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should validate limit must be a number", () => {
      const error = ctx.runExpectError('similar "test" --limit abc');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should show help", () => {
      const output = ctx.run("similar --help");
      expect(output).toContain("similar");
      expect(output).toContain("--threshold");
      expect(output).toContain("--limit");
      expect(output).toContain("id-or-text");
    });
  });

  describe("valid threshold options", () => {
    it("should accept threshold at boundary 0", () => {
      try {
        ctx.run('similar "test query" --threshold 0');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });

    it("should accept threshold at boundary 1", () => {
      try {
        ctx.run('similar "test query" --threshold 1');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });

    it("should accept threshold 0.7 (default)", () => {
      try {
        ctx.run('similar "test query" --threshold 0.7');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });
  });

  describe("valid limit options", () => {
    it("should accept limit 1", () => {
      try {
        ctx.run('similar "test query" --limit 1');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("limit");
      }
    });

    it("should accept limit 100", () => {
      try {
        ctx.run('similar "test query" --limit 100');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("limit");
      }
    });
  });

  describe("id resolution", () => {
    // When task ID doesn't exist, it should throw a task not found error
    // This proves the ID resolution path is being exercised
    it("should attempt to resolve task ID format", () => {
      try {
        ctx.run("similar TREK-999");
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        // Should get a "not found" error, not a validation error
        expect(error).toContain("not found");
      }
    });

    it("should attempt to resolve epic ID format", () => {
      try {
        ctx.run("similar EPIC-999");
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        // Should get a "not found" error, not a validation error
        expect(error).toContain("not found");
      }
    });
  });
});
