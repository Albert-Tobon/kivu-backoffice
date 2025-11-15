// components/.../StatusBadges.tsx
"use client";

import React, { useEffect, useState } from "react";

// ⬇️ IMPORTANTE: ruta relativa según dónde tengas StatusBadges
// Si StatusBadges está en: components/clientes/integrations/StatusBadges.tsx
// y useIntegrationSettings en: components/integrations/useIntegrationSettings.tsx
// entonces esta ruta es correcta:
import { useIntegrationSettings } from "@/app/api/integrations/status/useIntegrationSettings";

type StatusValue = "ok" | "error";
type IntegrationStatus = { status: StatusValue; message?: string };

interface ApiResponse {
  alegra: IntegrationStatus;
  docuseal: IntegrationStatus;
  mikrowisp: IntegrationStatus;
}

// añadimos "off" como estado visual
type Variant = "loading" | "ok" | "config" | "down" | "off";

function resolveVariant(s?: IntegrationStatus): Variant {
  if (!s) return "loading";
  if (s.status === "ok") return "ok";

  const msg = (s.message ?? "").toLowerCase();
  if (
    msg.includes("config") ||
    msg.includes("credencial") ||
    msg.includes("faltante")
  ) {
    return "config";
  }

  return "down";
}

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  if (variant === "loading") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Comprobando {label}...
      </span>
    );
  }

  if (variant === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#ACF227]/20 px-3 py-1 text-xs font-medium text-slate-800 ring-1 ring-[#ACF227]/60">
        <span className="h-2 w-2 rounded-full bg-[#ACF227]" />
        {label} activo
      </span>
    );
  }

  if (variant === "config") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        {label} en configuración
      </span>
    );
  }

  if (variant === "off") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        {label} desactivado
      </span>
    );
  }

  // down
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      {label} inactivo
    </span>
  );
}

export default function StatusBadges() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // switches ON/OFF desde Dashboard (localStorage)
  const { settings, ready } = useIntegrationSettings();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const resp = await fetch("/api/integrations/status", {
          cache: "no-store",
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const json = (await resp.json()) as ApiResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        console.error("Error cargando estado integraciones:", e);
        if (!cancelled) setError(String(e?.message ?? e));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mientras no sepamos los switches, mostramos "loading"
  const alegraVariant: Variant = !ready
    ? "loading"
    : settings.alegra
    ? resolveVariant(data?.alegra)
    : "off";

  const docusealVariant: Variant = !ready
    ? "loading"
    : settings.docuseal
    ? resolveVariant(data?.docuseal)
    : "off";

  const mikrowispVariant: Variant = !ready
    ? "loading"
    : settings.mikrowisp
    ? resolveVariant(data?.mikrowisp)
    : "off";

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge label="Alegra" variant={alegraVariant} />
      <Badge label="DocuSeal" variant={docusealVariant} />
      <Badge label="Mikrowisp" variant={mikrowispVariant} />

      {error && (
        <span className="block w-full text-xs text-red-500">
          No se pudo comprobar el estado de las integraciones.
        </span>
      )}
    </div>
  );
}
