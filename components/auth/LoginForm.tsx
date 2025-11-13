"use client";

// components/auth/LoginForm.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const ALLOWED_DOMAIN = "@kivu.com"; // cámbialo por el dominio real de KIVU

export const LoginForm: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!email.includes("@") || !email.endsWith(ALLOWED_DOMAIN)) {
      newErrors.email = `Debes usar tu correo corporativo ${ALLOWED_DOMAIN}`;
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      setLoading(true);

      // 🔐 Aquí luego llamaremos a /api/auth/login
      // Por ahora simulamos login correcto
      await new Promise((res) => setTimeout(res, 500));

      // Redirigimos al dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setFormError("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            KIVU Backoffice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inicia sesión con tu correo corporativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            name="email"
            label="Correo corporativo"
            placeholder={`tu.usuario${ALLOWED_DOMAIN}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            type="password"
            name="password"
            label="Contraseña"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          {formError && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Validando..." : "Ingresar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          KIVU ISP · Panel interno
        </p>
      </div>
    </div>
  );
};
