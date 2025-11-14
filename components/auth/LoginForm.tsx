"use client";

// components/auth/LoginForm.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

// Podemos permitir varios dominios aceptados
const ALLOWED_DOMAINS = ["@kivu.com.co", "@gmail.com"];
const LAST_EMAIL_KEY = "kivu:lastEmail";
// 🔑 clave donde guardamos el correo del usuario logueado
const LOGIN_EMAIL_KEY = "kivu:userEmail";

type FormErrors = {
  email?: string;
  password?: string;
};

export const LoginForm: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar último correo guardado (si existe)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LAST_EMAIL_KEY);
    if (stored) {
      setEmail(stored);
      setSavedEmail(stored);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "El correo es obligatorio.";
    } else if (
      !email.includes("@") ||
      !ALLOWED_DOMAINS.some((domain) => email.endsWith(domain))
    ) {
      newErrors.email = `Debes usar un correo permitido: ${ALLOWED_DOMAINS.join(
        " o "
      )}`;
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

      // Aquí iría autenticación real más adelante
      await new Promise((res) => setTimeout(res, 500));

      if (typeof window !== "undefined") {
        // ✅ 1) Guardamos SIEMPRE el correo del usuario logueado
        localStorage.setItem(LOGIN_EMAIL_KEY, email);

        // ✅ 2) Guardar o borrar el correo según "recordarme"
        if (rememberMe) {
          localStorage.setItem(LAST_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(LAST_EMAIL_KEY);
        }
      }

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

          {savedEmail && (
            <p className="mt-2 text-xs text-slate-500">
              Último acceso con{" "}
              <button
                type="button"
                onClick={() => setEmail(savedEmail)}
                className="font-medium text-blue-600 underline"
              >
                {savedEmail}
              </button>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            name="email"
            label="Correo corporativo"
            placeholder="tu.usuario@kivu.com.co o tu.usuario@gmail.com"
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Recordar este usuario en este navegador</span>
            </label>
          </div>

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
