import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AuthError extends Error {
  status = 401;
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const allowed = new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));

  if (!user?.email || !allowed.has(user.email.toLowerCase())) throw new AuthError("Admin access required.");
  return user;
}
