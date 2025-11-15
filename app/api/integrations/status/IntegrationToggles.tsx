"use client";

import React, { useEffect, useState } from "react";
import { useIntegrationSettings } from "./useIntegrationSettings";

type StatusValue = "ok" | "error";
type IntegrationStatus = { status: StatusValue; message?: string };

interface ApiResponse {
  alegra: IntegrationStatus;
  docuseal: IntegrationStatus;
  mikrowisp: IntegrationStatus;
}

type Variant = "loading" | "ok" | "config" | "down";

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

function StatusDot({ variant }: { variant: Variant }) {
  const base = "h-2 w-2 rounded-full";
  if (variant === "loading") return <span className={`${base} bg-slate-400`} />;
  if (variant === "ok") return <span className={`${base} bg-[#ACF227]`} />;
  if (variant === "config") return <span className={`${base} bg-amber-400`} />;
  return <span className={`${base} bg-red-500`} />;
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? "bg-lime-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function IntegrationToggles() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { settings, update } = useIntegrationSettings();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const resp = await fetch("/api/integrations/status", {
          cache: "no-store",
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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

  const alegraVariant = resolveVariant(data?.alegra);
  const docusealVariant = resolveVariant(data?.docuseal);
  const mikrowispVariant = resolveVariant(data?.mikrowisp);

  return (
    <section className="rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-semibold text-slate-900">
            Integraciones
          </h2>
          <p className="text-[10px] text-slate-500">
            Activa o desactiva en qué sistemas se sincronizan los nuevos
            clientes.
          </p>
        </div>
        {error && (
          <span className="text-[10px] text-red-500">
            Error consultando estado.
          </span>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {/* Alegra */}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <StatusDot variant={alegraVariant} />
            <span className="text-[11px] font-medium text-slate-800">
              Alegra
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              {settings.alegra ? "ON" : "OFF"}
            </span>
            <Switch
              checked={settings.alegra}
              onChange={() => update({ alegra: !settings.alegra })}
            />
          </div>
        </div>

        {/* DocuSeal */}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <StatusDot variant={docusealVariant} />
            <span className="text-[11px] font-medium text-slate-800">
              DocuSeal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              {settings.docuseal ? "ON" : "OFF"}
            </span>
            <Switch
              checked={settings.docuseal}
              onChange={() => update({ docuseal: !settings.docuseal })}
            />
          </div>
        </div>

        {/* Mikrowisp */}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <StatusDot variant={mikrowispVariant} />
            <span className="text-[11px] font-medium text-slate-800">
              Mikrowisp
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              {settings.mikrowisp ? "ON" : "OFF"}
            </span>
            <Switch
              checked={settings.mikrowisp}
              onChange={() => update({ mikrowisp: !settings.mikrowisp })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
