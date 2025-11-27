// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user.role as string) ?? "OPERATOR";
  const email = session.user.email ?? "";

  return (
    <DashboardClient
      currentUserRole={role}
      currentUserEmail={email}
    />
  );
}
