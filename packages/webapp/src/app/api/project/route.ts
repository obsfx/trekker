import { NextResponse } from "next/server";
import { getDb, projects } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const result = await db.select().from(projects);
    return NextResponse.json(result[0] || null);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
