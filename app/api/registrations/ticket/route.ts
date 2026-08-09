import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, registrations } from "@/db/schema";
import { formatEventDate } from "@/lib/format";
import { createTicketPdf } from "@/lib/ticket-pdf";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({ registrationId: z.string().uuid() });

function formatTime(startTime: string | null, endTime: string | null) {
  if (!startTime) return "As per event schedule";
  const start = startTime.slice(0, 5);
  const end = endTime ? endTime.slice(0, 5) : "";
  return end ? `${start} – ${end}` : start;
}

async function saveTicketPdf(registrationId: string, pdf: Uint8Array) {
  const bucket = process.env.SUPABASE_TICKET_BUCKET ?? process.env.SUPABASE_STORAGE_BUCKET ?? "public-assets";
  const path = `tickets/${registrationId}.pdf`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, Buffer.from(pdf), {
    cacheControl: "31536000",
    contentType: "application/pdf",
    upsert: true
  });
  if (error) throw error;
}

export async function GET(request: Request) {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Invalid ticket request." }, { status: 400 });

    const [row] = await getDb().select({
      registrationId: registrations.registrationId,
      visitorName: registrations.visitorName,
      eventId: events.id,
      eventName: events.eventName,
      startDate: events.startDate,
      endDate: events.endDate,
      startTime: events.startTime,
      endTime: events.endTime,
      venue: events.venue,
      address: events.address,
      city: events.city,
      amount: registrations.amount,
      paymentId: registrations.razorpayPaymentId
    }).from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(and(
        eq(registrations.id, parsed.data.registrationId),
        eq(registrations.paymentStatus, "PAID"),
        eq(registrations.registrationStatus, "CONFIRMED")
      ))
      .limit(1);

    if (!row || !row.paymentId) return NextResponse.json({ error: "Ticket is not available yet." }, { status: 404 });

    const pdf = await createTicketPdf({
      registrationId: row.registrationId,
      visitorName: row.visitorName,
      eventId: row.eventId,
      eventName: row.eventName,
      date: formatEventDate(row.startDate, row.endDate),
      time: formatTime(row.startTime, row.endTime),
      venue: row.venue,
      address: [row.address, row.city].filter(Boolean).join(", "),
      amount: row.amount,
      paymentId: row.paymentId,
      qrValue: JSON.stringify({ type: "soft-shine-ticket", registrationId: row.registrationId, eventId: row.eventId })
    });

    try {
      await saveTicketPdf(row.registrationId, pdf);
    } catch (error) {
      console.error("registration ticket storage", error);
    }

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${row.registrationId}-ticket.pdf"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("registration ticket GET", error);
    return NextResponse.json({ error: "We could not create your ticket." }, { status: 500 });
  }
}
