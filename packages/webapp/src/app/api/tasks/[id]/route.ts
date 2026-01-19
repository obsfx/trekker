import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, tasks, dependencies, epics } from "@/lib/db";
import { TASK_STATUSES } from "@/lib/constants";

async function getTaskWithDeps(taskId: string) {
  const db = getDb();

  const [taskResult, allDeps] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.id, taskId)),
    db.select().from(dependencies),
  ]);

  if (!taskResult[0]) {
    return null;
  }

  const task = taskResult[0];
  return {
    ...task,
    dependsOn: allDeps
      .filter((d) => d.taskId === task.id)
      .map((d) => d.dependsOnId),
    blocks: allDeps
      .filter((d) => d.dependsOnId === task.id)
      .map((d) => d.taskId),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTaskWithDeps(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const existing = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!existing[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { title, description, status, priority, tags, epicId } = body;

    // Validate status if provided
    if (status && !TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority !== undefined && (priority < 0 || priority > 5)) {
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

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (tags !== undefined) updates.tags = tags;
    if (epicId !== undefined) updates.epicId = epicId;

    await db.update(tasks).set(updates).where(eq(tasks.id, id));

    const updated = await getTaskWithDeps(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!existing[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
