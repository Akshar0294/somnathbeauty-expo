import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getDb()
      .select()
      .from(events)
      .where(and(eq(events.registrationOpen, true), inArray(events.status, ["OPEN", "LIVE"])))
      .orderBy(desc(events.featured), asc(events.startDate));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("events GET", error);
    return NextResponse.json({ error: "Events are temporarily unavailable." }, { status: 503 });
  }
}
