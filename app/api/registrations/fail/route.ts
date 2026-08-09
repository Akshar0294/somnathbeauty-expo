import { NextResponse } from "next/server";
import { markRegistrationPayment } from "@/lib/payments";
import { z } from "zod";

const failureSchema = z.object({
  registrationId: z.string().uuid(),
  status: z.enum(["FAILED", "CANCELLED"])
});

export async function POST(request: Request) {
  try {
    const parsed = failureSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment state." }, { status: 400 });
    await markRegistrationPayment(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("registration fail POST", error);
    return NextResponse.json({ error: "Payment state could not be saved." }, { status: 500 });
  }
}
