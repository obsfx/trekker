import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, epics } from "@/lib/db";
import { EPIC_STATUSES } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.select().from(epics).where(eq(epics.id, id));

    if (!result[0]) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
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

    const existing = await db.select().from(epics).where(eq(epics.id, id));
    if (!existing[0]) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    const { title, description, status, priority } = body;

    if (status && !EPIC_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    if (priority !== undefined && (priority < 0 || priority > 5)) {
      return NextResponse.json({ error: "Priority must be 0-5" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;

    await db.update(epics).set(updates).where(eq(epics.id, id));

    const updated = await db.select().from(epics).where(eq(epics.id, id));
    return NextResponse.json(updated[0]);
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

    const existing = await db.select().from(epics).where(eq(epics.id, id));
    if (!existing[0]) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    await db.delete(epics).where(eq(epics.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
