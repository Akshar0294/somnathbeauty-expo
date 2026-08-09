import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AuthError, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/admin/login");
    throw error;
  }
  return <AdminDashboard email={user.email ?? ""} />;
}
