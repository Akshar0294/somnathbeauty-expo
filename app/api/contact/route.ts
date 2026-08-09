import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema, firstZodError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
    await getDb().insert(contactMessages).values({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || "",
      message: parsed.data.message
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("contact POST", error);
    return NextResponse.json({ error: "We could not send your message. Please try again." }, { status: 500 });
  }
}
