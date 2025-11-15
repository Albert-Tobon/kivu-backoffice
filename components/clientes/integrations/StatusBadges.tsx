// components/integrations/StatusBadges.tsx
"use client";

import { useEffect, useState } from "react";

type IntegrationStatus = {
  status: "ok" | "error";
  message?: string;
};

type StatusResponse = {
  alegra: IntegrationStatus;
  docuseal: IntegrationStatus;
  mikrowisp: IntegrationStatus;
};

export default function StatusBadges() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch("/api/integrations/status");
        const data = await resp.json();
        setStatus(data);
      } catch (error) {
        console.error("Error cargando estado integraciones:", error);
        // si falla, marcamos todo como error
        setStatus({
          alegra: { status: "error", message: "No disponible" },
          docuseal: { status: "error", message: "No disponible" },
          mikrowisp: { status: "error", message: "No disponible" },
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const renderBadge = (
    label: string,
    integ?: IntegrationStatus,
    isWarning = false
  ) => {
    if (loading) {
      // skeleton simple mientras carga
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
          Cargando...
        </span>
      );
    }

    const ok = integ?.status === "ok";

    const baseClass =
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1";

    if (ok) {
      return (
        <span
          className={`${baseClass} bg-[#ACF227]/15 text-slate-800 ring-[#ACF227]/50`}
          title={integ?.message}
        >
          <span className="h-2 w-2 rounded-full bg-[#ACF227]" />
          {label} activo
        </span>
      );
    }

    // estado error / warning
    if (isWarning) {
      return (
        <span
          className={`${baseClass} bg-amber-50 text-amber-700 ring-amber-200`}
          title={integ?.message}
        >
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {label} en configuración
        </span>
      );
    }

    return (
      <span
        className={`${baseClass} bg-red-50 text-red-700 ring-red-200`}
        title={integ?.message}
      >
        <span className="h-2 w-2 rounded-full bg-red-500" />
        {label} inactivo
      </span>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {renderBadge("Alegra", status?.alegra)}
      {renderBadge("DocuSeal", status?.docuseal)}
      {renderBadge("Mikrowisp", status?.mikrowisp, true)}
    </div>
  );
}
