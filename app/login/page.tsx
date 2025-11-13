// app/login/page.tsx
import type { Metadata } from "next";
import { LoginForm } from "../../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login | KIVU Backoffice",
};

export default function LoginPage() {
  return <LoginForm />;
}
