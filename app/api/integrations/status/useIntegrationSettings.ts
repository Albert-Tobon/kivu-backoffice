"use client";

import { useCallback, useEffect, useState } from "react";

export type IntegrationSettings = {
  alegra: boolean;
  docuseal: boolean;
  mikrowisp: boolean;
};

export const INTEGRATION_SETTINGS_KEY = "kivu_integration_settings_v1";

const DEFAULT_SETTINGS: IntegrationSettings = {
  alegra: true,
  docuseal: true,
  mikrowisp: true,
};

export function useIntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSettings>(
    DEFAULT_SETTINGS
  );
  const [ready, setReady] = useState(false);

  // cargar desde localStorage al montar
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(INTEGRATION_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error("Error leyendo integración config:", err);
    } finally {
      setReady(true);
    }
  }, []);

  const update = useCallback(
    (partial: Partial<IntegrationSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            INTEGRATION_SETTINGS_KEY,
            JSON.stringify(next)
          );
        }
        return next;
      });
    },
    []
  );

  return { settings, update, ready };
}
