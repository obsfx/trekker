import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createServiceContext, initTrekkerService, type ServiceContext } from "../helpers/service-context";

describe("epic service (in-process)", () => {
  let ctx: ServiceContext;

  beforeEach(async () => {
    ctx = createServiceContext();
    await initTrekkerService(ctx);
  });

  afterEach(() => {
    ctx?.cleanup();
  });

  describe("create", () => {
    it("should create an epic with title only", async () => {
      const epic = await ctx.createEpic({ title: "Test Epic" });

      expect(epic.id).toMatch(/^EPIC-\d+$/);
      expect(epic.title).toBe("Test Epic");
      expect(epic.description).toBeNull();
      expect(epic.status).toBe("todo");
      expect(epic.priority).toBe(2);
    });

    it("should create an epic with all options", async () => {
      const epic = await ctx.createEpic({
        title: "Full Epic",
        description: "Description here",
        priority: 1,
        status: "in_progress",
      });

      expect(epic.title).toBe("Full Epic");
      expect(epic.description).toBe("Description here");
      expect(epic.status).toBe("in_progress");
      expect(epic.priority).toBe(1);
    });

    it("should create epic without description", async () => {
      const epic = await ctx.createEpic({ title: "Test" });
      expect(epic.description).toBeNull();
    });
  });

  describe("list", () => {
    it("should list all epics", async () => {
      await ctx.createEpic({ title: "Epic 1" });
      await ctx.createEpic({ title: "Epic 2" });
      await ctx.createEpic({ title: "Epic 3" });

      const epics = await ctx.listEpics();
      expect(epics).toHaveLength(3);
    });

    it("should return empty array when no epics", async () => {
      const epics = await ctx.listEpics();
      expect(epics).toHaveLength(0);
    });

    it("should filter by status", async () => {
      await ctx.createEpic({ title: "Todo Epic", status: "todo" });
      await ctx.createEpic({ title: "In Progress Epic", status: "in_progress" });
      await ctx.createEpic({ title: "Completed Epic", status: "completed" });

      const todoEpics = await ctx.listEpics("todo");
      expect(todoEpics).toHaveLength(1);
      expect(todoEpics[0].title).toBe("Todo Epic");

      const inProgressEpics = await ctx.listEpics("in_progress");
      expect(inProgressEpics).toHaveLength(1);
      expect(inProgressEpics[0].title).toBe("In Progress Epic");
    });
  });

  describe("show", () => {
    it("should show epic details", async () => {
      const created = await ctx.createEpic({ title: "Show Test", description: "Test description" });
      const shown = await ctx.getEpic(created.id);

      expect(shown).toBeDefined();
      expect(shown!.id).toBe(created.id);
      expect(shown!.title).toBe("Show Test");
      expect(shown!.description).toBe("Test description");
    });

    it("should return undefined for non-existent epic", async () => {
      const epic = await ctx.getEpic("EPIC-999");
      expect(epic).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update epic title", async () => {
      const created = await ctx.createEpic({ title: "Original Title" });
      const updated = await ctx.updateEpic(created.id, { title: "New Title" });

      expect(updated.title).toBe("New Title");
    });

    it("should update epic description", async () => {
      const created = await ctx.createEpic({ title: "Test" });
      const updated = await ctx.updateEpic(created.id, { description: "New description" });

      expect(updated.description).toBe("New description");
    });

    it("should update epic status", async () => {
      const created = await ctx.createEpic({ title: "Test" });
      const updated = await ctx.updateEpic(created.id, { status: "in_progress" });

      expect(updated.status).toBe("in_progress");
    });

    it("should update epic priority", async () => {
      const created = await ctx.createEpic({ title: "Test" });
      const updated = await ctx.updateEpic(created.id, { priority: 0 });

      expect(updated.priority).toBe(0);
    });

    it("should update multiple fields at once", async () => {
      const created = await ctx.createEpic({ title: "Test" });
      const updated = await ctx.updateEpic(created.id, {
        title: "Updated",
        description: "New desc",
        status: "completed",
        priority: 1,
      });

      expect(updated.title).toBe("Updated");
      expect(updated.description).toBe("New desc");
      expect(updated.status).toBe("completed");
      expect(updated.priority).toBe(1);
    });

    it("should fail for non-existent epic", async () => {
      await expect(ctx.updateEpic("EPIC-999", { title: "Test" }))
        .rejects.toThrow(/not found/i);
    });
  });

  describe("delete", () => {
    it("should delete an epic", async () => {
      const created = await ctx.createEpic({ title: "To Delete" });
      await ctx.deleteEpic(created.id);

      const epic = await ctx.getEpic(created.id);
      expect(epic).toBeUndefined();
    });

    it("should fail for non-existent epic", async () => {
      await expect(ctx.deleteEpic("EPIC-999"))
        .rejects.toThrow(/not found/i);
    });
  });
});
