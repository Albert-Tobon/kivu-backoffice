// app/login/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // Si ya hay sesión, no tiene sentido mostrar /login
  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginClient />;
}
