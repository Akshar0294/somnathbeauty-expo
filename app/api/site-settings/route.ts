import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { websiteSettings } from "@/db/schema";
import { fallbackSettings } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings] = await getDb().select().from(websiteSettings).limit(1);
    return NextResponse.json(settings ?? fallbackSettings);
  } catch (error) {
    console.error("site settings GET", error);
    return NextResponse.json(fallbackSettings);
  }
}
