import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, payments, registrations } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await getDb().select({
      id: payments.id,
      registrationId: registrations.registrationId,
      eventName: events.eventName,
      visitorName: registrations.visitorName,
      amount: payments.amount,
      razorpayOrderId: payments.razorpayOrderId,
      razorpayPaymentId: payments.razorpayPaymentId,
      status: payments.status,
      createdAt: payments.createdAt
    }).from(payments).leftJoin(registrations, eq(payments.registrationId, registrations.id)).leftJoin(events, eq(payments.eventId, events.id)).orderBy(desc(payments.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load payments." }, { status });
  }
}
