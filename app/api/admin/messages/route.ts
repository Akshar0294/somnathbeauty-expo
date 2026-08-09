import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getDb().select().from(contactMessages).orderBy(desc(contactMessages.createdAt)));
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load messages." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const parsed = z.object({ id: z.string().uuid(), status: z.enum(["READ", "UNREAD"]) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    await getDb().update(contactMessages).set({ status: parsed.data.status }).where(eq(contactMessages.id, parsed.data.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update message." }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    await getDb().delete(contactMessages).where(eq(contactMessages.id, parsed.data.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete message." }, { status });
  }
}
