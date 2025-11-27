// app/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AdminUsersClient
      currentUserEmail={session.user.email ?? ""}
      currentUserId={session.user.id ?? ""}
    />
  );
}
