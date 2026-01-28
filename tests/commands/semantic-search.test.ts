import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext, initTrekker, type TestContext } from "../helpers/test-context";

describe("semantic-search command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("command validation", () => {
    it("should require a query argument", () => {
      const error = ctx.runExpectError("semantic-search");
      expect(error.toLowerCase()).toContain("argument");
    });

    it("should validate threshold maximum", () => {
      const error = ctx.runExpectError('semantic-search "test" --threshold 1.5');
      expect(error.toLowerCase()).toContain("threshold");
    });

    it("should validate threshold minimum", () => {
      const error = ctx.runExpectError('semantic-search "test" --threshold -0.1');
      expect(error.toLowerCase()).toContain("threshold");
    });

    it("should validate entity types", () => {
      const error = ctx.runExpectError('semantic-search "test" --type invalid');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should validate limit must be positive", () => {
      const error = ctx.runExpectError('semantic-search "test" --limit 0');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should validate page must be positive", () => {
      const error = ctx.runExpectError('semantic-search "test" --page 0');
      expect(error.toLowerCase()).toContain("invalid");
    });

    it("should show help", () => {
      const output = ctx.run("semantic-search --help");
      expect(output).toContain("semantic-search");
      expect(output).toContain("--threshold");
      expect(output).toContain("--type");
      expect(output).toContain("--limit");
      expect(output).toContain("--page");
      expect(output).toContain("--status");
    });
  });

  describe("valid type options", () => {
    // These tests verify that valid types are accepted by the parser
    // The actual semantic search may fail if embedding model isn't loaded, but validation should pass
    it("should accept epic type", () => {
      // Type validation happens before semantic search is called
      // If we get a different error (not about type), validation passed
      try {
        ctx.run('semantic-search "test" --type epic');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        // Should not contain type-related error
        expect(error).not.toContain("invalid type");
      }
    });

    it("should accept multiple types", () => {
      try {
        ctx.run('semantic-search "test" --type epic,task,subtask');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("invalid type");
      }
    });

    it("should accept comment type", () => {
      try {
        ctx.run('semantic-search "test" --type comment');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("invalid type");
      }
    });
  });

  describe("valid threshold options", () => {
    it("should accept threshold at boundary 0", () => {
      try {
        ctx.run('semantic-search "test" --threshold 0');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });

    it("should accept threshold at boundary 1", () => {
      try {
        ctx.run('semantic-search "test" --threshold 1');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });

    it("should accept threshold 0.5", () => {
      try {
        ctx.run('semantic-search "test" --threshold 0.5');
      } catch (e) {
        const error = (e as Error).message.toLowerCase();
        expect(error).not.toContain("threshold");
      }
    });
  });
});
