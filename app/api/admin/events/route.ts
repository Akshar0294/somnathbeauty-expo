import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  eventName: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(280).default(""),
  fullDescription: z.string().trim().max(3000).default(""),
  eventImage: z.string().url().optional().nullable().or(z.literal("")),
  galleryImages: z.array(z.string().url()).default([]),
  venue: z.string().trim().max(160).default(""),
  address: z.string().trim().max(240).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default("Gujarat"),
  country: z.string().trim().max(80).default("India"),
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  startTime: z.string().optional().nullable().or(z.literal("")),
  endTime: z.string().optional().nullable().or(z.literal("")),
  registrationPrice: z.coerce.number().int().min(0).max(100000),
  maximumCapacity: z.coerce.number().int().min(0).max(1000000),
  availableSlots: z.coerce.number().int().min(0).max(1000000),
  registrationOpen: z.boolean(),
  registrationDeadline: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["OPEN", "LIVE", "COMPLETED", "CLOSED"]),
  sponsorName: z.string().trim().max(160).optional().nullable().or(z.literal("")),
  sponsorLogo: z.string().url().optional().nullable().or(z.literal("")),
  sponsorWebsite: z.string().url().optional().nullable().or(z.literal("")),
  termsAndConditions: z.string().trim().max(2000).default(""),
  featured: z.boolean()
});

function values(input: z.infer<typeof eventSchema>) {
  return {
    eventName: input.eventName,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    eventImage: input.eventImage || null,
    galleryImages: input.galleryImages,
    venue: input.venue,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime || null,
    endTime: input.endTime || null,
    registrationPrice: input.registrationPrice,
    maximumCapacity: input.maximumCapacity,
    availableSlots: input.availableSlots,
    registrationOpen: input.registrationOpen,
    registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
    status: input.status,
    sponsorName: input.sponsorName || null,
    sponsorLogo: input.sponsorLogo || null,
    sponsorWebsite: input.sponsorWebsite || null,
    termsAndConditions: input.termsAndConditions,
    featured: input.featured,
    updatedAt: new Date()
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const rows = await getDb().select().from(events).orderBy(asc(events.startDate));
    return NextResponse.json(rows);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load events." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid event." }, { status: 400 });
    const [created] = await getDb().insert(events).values(values(parsed.data)).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create event." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    const [updated] = await getDb().update(events).set(values(parsed.data)).where(eq(events.id, parsed.data.id)).returning();
    if (!updated) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update event." }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = z.object({ id: z.string().uuid() }).safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    await getDb().delete(events).where(eq(events.id, body.data.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 409;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not delete event. Existing registrations may prevent deletion." }, { status });
  }
}
