import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext, type TestContext } from "../helpers/test-context";

describe("quickstart command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it("should output quickstart guide", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("Trekker Quickstart");
  });

  it("should include setup instructions", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("trekker init");
    expect(output).toContain("trekker wipe");
  });

  it("should include epic commands", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("epic create");
    expect(output).toContain("epic list");
    expect(output).toContain("epic show");
    expect(output).toContain("epic update");
    expect(output).toContain("epic delete");
    expect(output).toContain("epic complete");
  });

  it("should include task commands", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("task create");
    expect(output).toContain("task list");
    expect(output).toContain("task show");
    expect(output).toContain("task update");
    expect(output).toContain("task delete");
  });

  it("should include subtask commands", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("subtask create");
    expect(output).toContain("subtask list");
    expect(output).toContain("subtask update");
    expect(output).toContain("subtask delete");
  });

  it("should include comment commands", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("comment add");
    expect(output).toContain("comment list");
    expect(output).toContain("comment update");
    expect(output).toContain("comment delete");
  });

  it("should include dependency commands", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("dep add");
    expect(output).toContain("dep remove");
    expect(output).toContain("dep list");
  });

  it("should include search command", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("search");
  });

  it("should include history command", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("history");
  });

  it("should include list command", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("trekker list");
  });

  it("should include status values", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("todo");
    expect(output).toContain("in_progress");
    expect(output).toContain("completed");
    expect(output).toContain("archived");
  });

  it("should include priority scale", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("critical");
    expect(output).toContain("high");
    expect(output).toContain("medium");
    expect(output).toContain("low");
  });

  it("should include agent workflow", () => {
    const output = ctx.run("quickstart");

    expect(output).toContain("Agent Workflow");
  });

  it("should work without initialization", () => {
    // quickstart should work even without init
    const output = ctx.run("quickstart");
    expect(output.length).toBeGreaterThan(100);
  });
});
