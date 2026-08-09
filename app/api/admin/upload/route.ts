import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "uploads").replace(/[^a-z0-9/_-]/gi, "").slice(0, 40) || "uploads";
    if (!(file instanceof File)) return NextResponse.json({ error: "Select an image." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Images must be smaller than 8 MB." }, { status: 400 });
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "public-assets";
    const path = folder + "/" + randomUUID() + "-" + file.name.replace(/[^a-z0-9._-]/gi, "-").toLowerCase();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    const status = error instanceof AuthError ? 401 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not upload image." }, { status });
  }
}
