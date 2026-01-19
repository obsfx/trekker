import { NextRequest, NextResponse } from "next/server";
import { getDb, epics, projects } from "@/lib/db";
import { generateId } from "@/lib/id-generator";
import { EPIC_STATUSES } from "@/lib/constants";

export async function GET() {
  try {
    const db = getDb();
    const allEpics = await db.select().from(epics);
    return NextResponse.json(allEpics);
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

    const { title, description, status = "todo", priority = 2 } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (status && !EPIC_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    if (priority < 0 || priority > 5) {
      return NextResponse.json({ error: "Priority must be 0-5" }, { status: 400 });
    }

    const project = await db.select().from(projects);
    if (!project[0]) {
      return NextResponse.json({ error: "Project not initialized" }, { status: 400 });
    }

    const id = generateId("epic");
    const now = new Date();

    const epic = {
      id,
      projectId: project[0].id,
      title,
      description: description || null,
      status,
      priority,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(epics).values(epic);

    return NextResponse.json(epic, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
