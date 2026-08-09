import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, registrations } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await getDb().select({
      id: registrations.id,
      registrationId: registrations.registrationId,
      visitorName: registrations.visitorName,
      phone: registrations.phone,
      email: registrations.email,
      city: registrations.city,
      gender: registrations.gender,
      paymentStatus: registrations.paymentStatus,
      registrationStatus: registrations.registrationStatus,
      amount: registrations.amount,
      createdAt: registrations.createdAt,
      eventName: events.eventName
    }).from(registrations).leftJoin(events, eq(registrations.eventId, events.id)).orderBy(desc(registrations.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load registrations." }, { status });
  }
}
