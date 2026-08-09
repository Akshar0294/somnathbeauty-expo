import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { events, payments, registrations } from "@/db/schema";

export class PaymentStateError extends Error {
  status = 409;
}

export function normalizePhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("+91")) return compact;
  if (compact.startsWith("91") && compact.length === 12) return "+" + compact;
  return "+91" + compact;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function confirmRegistrationPayment(input: { registrationId: string; orderId: string; paymentId: string; signatureVerified: boolean }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(registrations).where(eq(registrations.id, input.registrationId)).for("update").limit(1);
    if (!current) throw new PaymentStateError("Registration not found.");
    if (current.registrationStatus === "CONFIRMED" && current.paymentStatus === "PAID") return current;
    if (current.paymentStatus === "FAILED" || current.paymentStatus === "CANCELLED" || current.registrationStatus === "CANCELLED") {
      throw new PaymentStateError("This payment attempt is no longer active.");
    }
    if (current.razorpayOrderId !== input.orderId) throw new PaymentStateError("Payment order does not match this registration.");

    const [slot] = await tx.update(events)
      .set({ availableSlots: sql`${events.availableSlots} - 1`, updatedAt: new Date() })
      .where(and(eq(events.id, current.eventId), gt(events.availableSlots, 0)))
      .returning({ id: events.id });
    if (!slot) throw new PaymentStateError("This expo has just reached capacity.");

    const [updated] = await tx.update(registrations)
      .set({
        paymentStatus: "PAID",
        registrationStatus: "CONFIRMED",
        razorpayPaymentId: input.paymentId,
        razorpaySignatureVerified: input.signatureVerified,
        updatedAt: new Date()
      })
      .where(eq(registrations.id, input.registrationId))
      .returning();

    await tx.update(payments)
      .set({ status: "PAID", razorpayPaymentId: input.paymentId, signatureVerified: input.signatureVerified, updatedAt: new Date() })
      .where(eq(payments.razorpayOrderId, input.orderId));

    return updated;
  });
}

export async function markRegistrationPayment(input: { registrationId: string; status: "FAILED" | "CANCELLED" }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [registration] = await tx.select().from(registrations).where(eq(registrations.id, input.registrationId)).for("update").limit(1);
    if (!registration) return null;
    if (registration.paymentStatus === "PAID" || registration.registrationStatus === "CONFIRMED") return registration;
    const [updated] = await tx.update(registrations)
      .set({ paymentStatus: input.status, registrationStatus: input.status === "CANCELLED" ? "CANCELLED" : "PENDING", updatedAt: new Date() })
      .where(eq(registrations.id, input.registrationId))
      .returning();
    if (registration.razorpayOrderId) {
      await tx.update(payments).set({ status: input.status, updatedAt: new Date() }).where(eq(payments.razorpayOrderId, registration.razorpayOrderId));
    }
    return updated;
  });
}
