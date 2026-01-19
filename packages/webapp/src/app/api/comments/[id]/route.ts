import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, comments } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db.select().from(comments).where(eq(comments.id, id));
    if (!existing[0]) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await db.delete(comments).where(eq(comments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
