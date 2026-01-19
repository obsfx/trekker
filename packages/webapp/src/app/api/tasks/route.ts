import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, tasks, dependencies, projects, epics } from "@/lib/db";
import { generateId } from "@/lib/id-generator";
import { TASK_STATUSES } from "@/lib/constants";

export async function GET() {
  try {
    const db = getDb();
    const [allTasks, allDeps] = await Promise.all([
      db.select().from(tasks),
      db.select().from(dependencies),
    ]);

    const tasksWithDeps = allTasks.map((task) => ({
      ...task,
      dependsOn: allDeps
        .filter((d) => d.taskId === task.id)
        .map((d) => d.dependsOnId),
      blocks: allDeps
        .filter((d) => d.dependsOnId === task.id)
        .map((d) => d.taskId),
    }));

    return NextResponse.json(tasksWithDeps);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const {
      title,
      description,
      status = "todo",
      priority = 2,
      epicId,
      parentTaskId,
      tags,
    } = body;

    // Validate title
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate status
    if (status && !TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    // Validate priority
    if (priority < 0 || priority > 5) {
      return NextResponse.json(
        { error: "Priority must be 0-5" },
        { status: 400 }
      );
    }

    // Validate epic exists if provided
    if (epicId) {
      const epic = await db.select().from(epics).where(eq(epics.id, epicId));
      if (!epic[0]) {
        return NextResponse.json(
          { error: "Epic not found" },
          { status: 400 }
        );
      }
    }

    // Validate parent task exists if provided
    if (parentTaskId) {
      const parentTask = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, parentTaskId));
      if (!parentTask[0]) {
        return NextResponse.json(
          { error: "Parent task not found" },
          { status: 400 }
        );
      }
    }

    // Get project
    const project = await db.select().from(projects);
    if (!project[0]) {
      return NextResponse.json(
        { error: "Project not initialized" },
        { status: 400 }
      );
    }

    const id = generateId("task");
    const now = new Date();

    const task = {
      id,
      projectId: project[0].id,
      epicId: epicId || null,
      parentTaskId: parentTaskId || null,
      title,
      description: description || null,
      status,
      priority,
      tags: tags || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(task);

    return NextResponse.json(
      { ...task, dependsOn: [], blocks: [] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
