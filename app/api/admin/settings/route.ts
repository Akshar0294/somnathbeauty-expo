import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { websiteSettings } from "@/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  siteLogo: z.string().url().optional().nullable().or(z.literal("")),
  heroHeading: z.string().trim().min(2).max(180),
  heroDescription: z.string().trim().min(2).max(600),
  heroImage: z.string().url().optional().nullable().or(z.literal("")),
  aboutText: z.string().trim().min(2).max(1800),
  contactNumbers: z.array(z.object({ name: z.string().trim().min(2), phone: z.string().trim().min(7) })),
  address: z.string().trim().min(2).max(400),
  googleMapsUrl: z.string().url(),
  footerText: z.string().trim().min(2).max(240),
  socialLinks: z.record(z.string(), z.string()),
  defaultRegistrationPrice: z.coerce.number().int().min(0).max(100000)
});

export async function GET() {
  try {
    await requireAdmin();
    const [settings] = await getDb().select().from(websiteSettings).limit(1);
    return NextResponse.json(settings);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load settings." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
    const [updated] = await getDb().update(websiteSettings).set({
      siteLogo: parsed.data.siteLogo || null,
      heroHeading: parsed.data.heroHeading,
      heroDescription: parsed.data.heroDescription,
      heroImage: parsed.data.heroImage || null,
      aboutText: parsed.data.aboutText,
      contactNumbers: parsed.data.contactNumbers,
      address: parsed.data.address,
      googleMapsUrl: parsed.data.googleMapsUrl,
      footerText: parsed.data.footerText,
      socialLinks: parsed.data.socialLinks,
      defaultRegistrationPrice: parsed.data.defaultRegistrationPrice,
      updatedAt: new Date()
    }).where(eq(websiteSettings.id, 1)).returning();
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save settings." }, { status });
  }
}
