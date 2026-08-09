import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { registrations } from "@/db/schema";
import { confirmRegistrationPayment, markRegistrationPayment } from "@/lib/payments";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });

  try {
    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const paymentEntity = body.payload?.payment?.entity;
    const orderEntity = body.payload?.order?.entity;
    const orderId = paymentEntity?.order_id ?? orderEntity?.id;
    const paymentId = paymentEntity?.id;
    if (!orderId) return NextResponse.json({ ok: true });

    const [registration] = await getDb().select().from(registrations).where(eq(registrations.razorpayOrderId, orderId)).limit(1);
    if (!registration) return NextResponse.json({ ok: true });

    if (body.event === "payment.captured" || body.event === "order.paid") {
      if (paymentId) {
        try {
          await confirmRegistrationPayment({ registrationId: registration.id, orderId, paymentId, signatureVerified: true });
        } catch (error) {
          console.error("webhook confirmation", error);
        }
      }
    } else if (body.event === "payment.failed") {
      await markRegistrationPayment({ registrationId: registration.id, status: "FAILED" });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("payment webhook POST", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    order?: { entity?: { id?: string } };
  };
};
