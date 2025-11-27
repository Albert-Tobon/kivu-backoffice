// app/login/LoginClient.tsx
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CORPORATE_DOMAIN = "kivu.com.co";

export function LoginClient() {
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buildCorporateEmail = (raw: string) => {
    const value = raw.trim().toLowerCase();

    if (!value) return "";
    if (value.includes("@")) return value;

    return `${value}@${CORPORATE_DOMAIN}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = buildCorporateEmail(emailInput);

      if (!email.endsWith(`@${CORPORATE_DOMAIN}`)) {
        setError(`Solo se permiten correos @${CORPORATE_DOMAIN}`);
        setLoading(false);
        return;
      }

      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
        email,
      });
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          Backoffice KIVU
        </h1>
        <p className="mt-2 text-sm text-slate-600 text-center">
          Inicia sesión con tu cuenta corporativa{" "}
          <span className="font-semibold">@{CORPORATE_DOMAIN}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Correo"
            name="email"
            type="text"
            placeholder="alguien (se completará @kivu.com.co)"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            autoComplete="email"
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full mt-2"
            disabled={loading}
          >
            {loading ? "Conectando..." : "Ingresar con Google"}
          </Button>
        </form>
      </div>
    </main>
  );
}
