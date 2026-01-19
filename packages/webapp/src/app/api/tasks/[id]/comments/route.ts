import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, comments, tasks } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const taskComments = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, id))
      .orderBy(comments.createdAt);

    return NextResponse.json(taskComments);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const db = getDb();
    const body = await request.json();

    const { author, content } = body;

    if (!author || typeof author !== "string") {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify task exists
    const task = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task[0]) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const id = `CMT-${Date.now()}`;
    const now = new Date();

    const comment = {
      id,
      taskId,
      author,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(comments).values(comment);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
