import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, tasks, dependencies } from "@/lib/db";
import { generateUuid } from "@/lib/id-generator";

async function wouldCreateCycle(
  taskId: string,
  dependsOnId: string
): Promise<boolean> {
  const db = getDb();
  const visited = new Set<string>();
  const stack = [dependsOnId];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === taskId) {
      return true; // Found a path from dependsOnId to taskId
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const deps = await db
      .select({ dependsOnId: dependencies.dependsOnId })
      .from(dependencies)
      .where(eq(dependencies.taskId, current));

    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        stack.push(dep.dependsOnId);
      }
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { taskId, dependsOnId } = body;

    // Validate required fields
    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    if (!dependsOnId || typeof dependsOnId !== "string") {
      return NextResponse.json(
        { error: "dependsOnId is required" },
        { status: 400 }
      );
    }

    // Validate task can't depend on itself
    if (taskId === dependsOnId) {
      return NextResponse.json(
        { error: "A task cannot depend on itself" },
        { status: 400 }
      );
    }

    // Validate both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.id, taskId)),
      db.select().from(tasks).where(eq(tasks.id, dependsOnId)),
    ]);

    if (!task[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!dependsOnTask[0]) {
      return NextResponse.json(
        { error: "Dependency task not found" },
        { status: 404 }
      );
    }

    // Validate dependency doesn't already exist
    const existingDep = await db
      .select()
      .from(dependencies)
      .where(
        and(
          eq(dependencies.taskId, taskId),
          eq(dependencies.dependsOnId, dependsOnId)
        )
      );

    if (existingDep[0]) {
      return NextResponse.json(
        { error: "Dependency already exists" },
        { status: 400 }
      );
    }

    // Validate adding this dependency won't create a cycle
    const wouldCycle = await wouldCreateCycle(taskId, dependsOnId);
    if (wouldCycle) {
      return NextResponse.json(
        { error: "Adding this dependency would create a cycle" },
        { status: 400 }
      );
    }

    const id = generateUuid();
    const now = new Date();

    const dependency = {
      id,
      taskId,
      dependsOnId,
      createdAt: now,
    };

    await db.insert(dependencies).values(dependency);

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const dependsOnId = searchParams.get("dependsOnId");

    // Validate required params
    if (!taskId) {
      return NextResponse.json(
        { error: "taskId query param is required" },
        { status: 400 }
      );
    }

    if (!dependsOnId) {
      return NextResponse.json(
        { error: "dependsOnId query param is required" },
        { status: 400 }
      );
    }

    // Validate dependency exists
    const existingDep = await db
      .select()
      .from(dependencies)
      .where(
        and(
          eq(dependencies.taskId, taskId),
          eq(dependencies.dependsOnId, dependsOnId)
        )
      );

    if (!existingDep[0]) {
      return NextResponse.json(
        { error: "Dependency not found" },
        { status: 404 }
      );
    }

    await db
      .delete(dependencies)
      .where(
        and(
          eq(dependencies.taskId, taskId),
          eq(dependencies.dependsOnId, dependsOnId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
