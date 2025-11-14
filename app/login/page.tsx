// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        setError(data?.error ?? "Error al iniciar sesión");
      } else {
        // login ok -> a dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error de conexión con el servidor");
    } finally {
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
          Inicia sesión con el correo autorizado.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Correo"
            name="email"
            type="email"
            placeholder="contabilidad@kivu.com.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Verificando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
