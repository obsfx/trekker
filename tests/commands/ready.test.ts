import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  createTestContext,
  initTrekker,
  type TestContext,
} from "../helpers/test-context";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface ReadyTaskDependent {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface ReadyTask {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  epicId: string | null;
  tags: string | null;
  dependents: ReadyTaskDependent[];
}

describe("ready command", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    initTrekker(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  it("should show tasks with no dependencies as ready", () => {
    ctx.run('task create -t "Task A"');
    ctx.run('task create -t "Task B"');

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(2);
    expect(ready[0].id).toBe("TREK-1");
    expect(ready[1].id).toBe("TREK-2");
  });

  it("should exclude tasks blocked by incomplete dependencies", () => {
    ctx.run('task create -t "Task A"');
    ctx.run('task create -t "Task B"');
    ctx.run("dep add TREK-2 TREK-1"); // TREK-2 depends on TREK-1

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-1");
  });

  it("should show task as ready when all dependencies are completed", () => {
    ctx.run('task create -t "Task A"');
    ctx.run('task create -t "Task B"');
    ctx.run("dep add TREK-2 TREK-1");
    ctx.run("task update TREK-1 -s completed");

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-2");
  });

  it("should show task as ready when dependencies are wont_fix", () => {
    ctx.run('task create -t "Task A"');
    ctx.run('task create -t "Task B"');
    ctx.run("dep add TREK-2 TREK-1");
    ctx.run("task update TREK-1 -s wont_fix");

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-2");
  });

  it("should include downstream dependents for each ready task", () => {
    ctx.run('task create -t "Foundation"');
    ctx.run('task create -t "Feature A"');
    ctx.run('task create -t "Feature B"');
    ctx.run("dep add TREK-2 TREK-1");
    ctx.run("dep add TREK-3 TREK-1");

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-1");
    expect(ready[0].dependents).toHaveLength(2);

    const depIds = ready[0].dependents.map((d) => d.id);
    expect(depIds).toContain("TREK-2");
    expect(depIds).toContain("TREK-3");
  });

  it("should return empty array when no tasks exist", () => {
    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(0);
  });

  it("should return empty array when all tasks are completed", () => {
    ctx.run('task create -t "Done Task"');
    ctx.run("task update TREK-1 -s completed");

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(0);
  });

  it("should exclude subtasks from ready list", () => {
    ctx.run('task create -t "Parent Task"');
    ctx.run('subtask create TREK-1 -t "Child Task"');

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-1");
  });

  it("should order ready tasks by priority (lowest number first)", () => {
    ctx.run('task create -t "Low priority" -p 4');
    ctx.run('task create -t "High priority" -p 0');
    ctx.run('task create -t "Medium priority" -p 2');

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(3);
    expect(ready[0].priority).toBe(0);
    expect(ready[1].priority).toBe(2);
    expect(ready[2].priority).toBe(4);
  });

  it("should exclude in_progress tasks", () => {
    ctx.run('task create -t "Todo Task"');
    ctx.run('task create -t "In Progress Task"');
    ctx.run("task update TREK-2 -s in_progress");

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-1");
  });

  it("should handle chain dependencies correctly", () => {
    ctx.run('task create -t "Step 1"');
    ctx.run('task create -t "Step 2"');
    ctx.run('task create -t "Step 3"');
    ctx.run("dep add TREK-2 TREK-1"); // Step 2 depends on Step 1
    ctx.run("dep add TREK-3 TREK-2"); // Step 3 depends on Step 2

    const ready = ctx.runToon<ReadyTask[]>("ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("TREK-1");
    expect(ready[0].dependents).toHaveLength(1);
    expect(ready[0].dependents[0].id).toBe("TREK-2");
  });

  it("should handle multiple dependencies where some are completed", () => {
    ctx.run('task create -t "Dep A"');
    ctx.run('task create -t "Dep B"');
    ctx.run('task create -t "Blocked Task"');
    ctx.run("dep add TREK-3 TREK-1");
    ctx.run("dep add TREK-3 TREK-2");
    ctx.run("task update TREK-1 -s completed");

    // TREK-3 still blocked by TREK-2
    const ready = ctx.runToon<ReadyTask[]>("ready");
    const readyIds = ready.map((t) => t.id);
    expect(readyIds).toContain("TREK-2");
    expect(readyIds).not.toContain("TREK-3");
  });

  it("should show human-readable output", () => {
    ctx.run('task create -t "Ready Task"');
    ctx.run('task create -t "Blocked Task"');
    ctx.run("dep add TREK-2 TREK-1");

    const output = ctx.run("ready");
    expect(output).toContain("1 ready task(s)");
    expect(output).toContain("TREK-1");
    expect(output).toContain("Ready Task");
    expect(output).toContain("unblocks TREK-2");
    expect(output).toContain("Blocked Task");
  });
});
