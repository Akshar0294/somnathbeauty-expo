import { NextResponse } from "next/server";
import { confirmRegistrationPayment, PaymentStateError, verifyRazorpaySignature } from "@/lib/payments";
import { z } from "zod";

const verifySchema = z.object({
  registrationId: z.string().uuid(),
  razorpay_payment_id: z.string().min(5).max(100),
  razorpay_order_id: z.string().min(5).max(100),
  razorpay_signature: z.string().min(10).max(200)
});

export async function POST(request: Request) {
  try {
    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: "Payment is not configured yet." }, { status: 503 });
    const { registrationId, razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = parsed.data;
    if (!verifyRazorpaySignature(orderId, paymentId, signature, secret)) return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });

    const registration = await confirmRegistrationPayment({ registrationId, orderId, paymentId, signatureVerified: true });
    return NextResponse.json({ registrationId: registration.registrationId, amount: registration.amount, paymentStatus: registration.paymentStatus, registrationStatus: registration.registrationStatus });
  } catch (error) {
    console.error("registration verify POST", error);
    const status = error instanceof PaymentStateError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status });
  }
}
