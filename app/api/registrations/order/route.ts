import Razorpay from "razorpay";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events, payments, registrations } from "@/db/schema";
import { normalizePhone } from "@/lib/payments";
import { firstZodError, registrationSchema } from "@/lib/validation";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const orderSchema = registrationSchema.extend({ registrationId: z.string().uuid().optional() });

function newRegistrationId() {
  return "SSC-" + new Date().getFullYear() + "-" + randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    const input = parsed.data;
    const db = getDb();
    const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);

    if (!event || !event.registrationOpen || !["OPEN", "LIVE"].includes(event.status)) return NextResponse.json({ error: "This expo is not open for registration." }, { status: 409 });
    if (event.availableSlots < 1) return NextResponse.json({ error: "This expo has reached capacity." }, { status: 409 });
    if (event.registrationDeadline && event.registrationDeadline < new Date()) return NextResponse.json({ error: "Registration for this expo has closed." }, { status: 409 });

    const phone = normalizePhone(input.phone);
    let registration = input.registrationId
      ? (await db.select().from(registrations).where(eq(registrations.id, input.registrationId)).limit(1))[0]
      : undefined;
    if (registration?.eventId !== event.id) registration = undefined;
    if (!registration) registration = (await db.select().from(registrations).where(and(eq(registrations.eventId, event.id), eq(registrations.phone, phone))).limit(1))[0];
    if (registration?.paymentStatus === "PAID" || registration?.registrationStatus === "CONFIRMED") return NextResponse.json({ error: "You are already registered for this expo." }, { status: 409 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Payment is not configured yet." }, { status: 503 });

    const registrationReference = registration?.registrationId ?? newRegistrationId();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: event.registrationPrice * 100,
      currency: "INR",
      receipt: registrationReference,
      notes: { event_id: event.id, registration_id: registrationReference }
    });

    if (registration) {
      const [updated] = await db.update(registrations).set({
        visitorName: input.visitorName,
        phone,
        email: input.email || null,
        city: input.city,
        gender: "Female",
        paymentStatus: "PENDING",
        registrationStatus: "PENDING",
        razorpayOrderId: order.id,
        razorpayPaymentId: null,
        razorpaySignatureVerified: false,
        amount: event.registrationPrice,
        updatedAt: new Date()
      }).where(eq(registrations.id, registration.id)).returning();
      registration = updated;
    } else {
      const [created] = await db.insert(registrations).values({
        registrationId: registrationReference,
        eventId: event.id,
        visitorName: input.visitorName,
        phone,
        email: input.email || null,
        city: input.city,
        gender: "Female",
        paymentStatus: "PENDING",
        registrationStatus: "PENDING",
        razorpayOrderId: order.id,
        amount: event.registrationPrice,
        currency: "INR"
      }).returning();
      registration = created;
    }

    await db.insert(payments).values({
      registrationId: registration.id,
      eventId: event.id,
      razorpayOrderId: order.id,
      amount: event.registrationPrice,
      currency: "INR",
      status: "PENDING"
    });

    return NextResponse.json({
      registrationId: registration.id,
      registrationReference: registration.registrationId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId
    });
  } catch (error) {
    console.error("registration order POST", error);
    return NextResponse.json({ error: "We could not start registration. Please try again." }, { status: 500 });
  }
}
