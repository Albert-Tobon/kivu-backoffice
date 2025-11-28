// components/clientes/NewClientForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import Button from "../ui/button";
import type { Client } from "./types";
import { STORAGE_KEY } from "./types";

interface NewClientFormValues {
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
}

type FieldStatus = "idle" | "checking" | "exists" | "not-found" | "error";
type DocuSealStatus = FieldStatus;

// Valores fijos / automáticos
const DEFAULT_DEPARTAMENTO = "Cundinamarca";
const DEFAULT_MUNICIPIO = "Arbeláez";

const emptyForm: NewClientFormValues = {
  nombre: "",
  apellido: "",
  cedula: "",
  correo: "",
  telefono: "",
  direccion: "",
  departamento: DEFAULT_DEPARTAMENTO,
  municipio: DEFAULT_MUNICIPIO,
};

const NewClientForm: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<NewClientFormValues>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewClientFormValues, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // Alegra: estado por campo (cédula y correo independientes)
  const [alegraCedulaStatus, setAlegraCedulaStatus] =
    useState<FieldStatus>("idle");
  const [alegraCedulaMessage, setAlegraCedulaMessage] = useState<
    string | null
  >(null);

  const [alegraCorreoStatus, setAlegraCorreoStatus] =
    useState<FieldStatus>("idle");
  const [alegraCorreoMessage, setAlegraCorreoMessage] = useState<
    string | null
  >(null);

  // DocuSeal (por correo)
  const [docuStatus, setDocuStatus] = useState<DocuSealStatus>("idle");
  const [docuMessage, setDocuMessage] = useState<string | null>(null);

  // FUTURO: Mikrowisp
  // const [mwStatus, setMwStatus] = useState<FieldStatus>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!form.correo.trim()) newErrors.correo = "El correo es obligatorio";
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!form.apellido.trim()) newErrors.apellido = "El apellido es obligatorio";

    // Si Alegra dice que ya existe, bloqueamos según el campo
    if (alegraCedulaStatus === "exists") {
      newErrors.cedula =
        "Este cliente ya está registrado en Alegra. Coincidencia por cédula.";
    } else if (alegraCorreoStatus === "exists") {
      newErrors.correo = "Este correo ya está registrado en Alegra.";
    }

    // DocuSeal sigue siendo informativo (no bloquea), pero podrías activar esto:
    /*
    if (docuStatus === "exists") {
      newErrors.correo =
        "Este correo ya tiene documentos en DocuSeal. Revisa antes de crear un nuevo cliente.";
    }
    */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- Validación en tiempo real contra Alegra (cédula / correo) ----
  useEffect(() => {
    const cedula = form.cedula.trim();
    const correo = form.correo.trim();

    if (!cedula && !correo) {
      setAlegraCedulaStatus("idle");
      setAlegraCedulaMessage(null);
      setAlegraCorreoStatus("idle");
      setAlegraCorreoMessage(null);
      setErrors((prev) => ({
        ...prev,
        cedula: undefined,
        correo: undefined,
      }));
      return;
    }

    let cancelled = false;

    setAlegraCedulaStatus(cedula ? "checking" : "idle");
    setAlegraCorreoStatus(correo ? "checking" : "idle");
    if (cedula) setAlegraCedulaMessage("Validando cédula en Alegra...");
    if (correo) setAlegraCorreoMessage("Validando correo en Alegra...");

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch("/api/alegra/contacts/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula, correo }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "[NewClientForm] Error check Alegra. status=",
            res.status,
            "body=",
            text
          );

          if (cedula) {
            setAlegraCedulaStatus("error");
            setAlegraCedulaMessage("No se pudo validar la cédula en Alegra.");
          } else {
            setAlegraCedulaStatus("idle");
            setAlegraCedulaMessage(null);
          }

          if (correo) {
            setAlegraCorreoStatus("error");
            setAlegraCorreoMessage("No se pudo validar el correo en Alegra.");
          } else {
            setAlegraCorreoStatus("idle");
            setAlegraCorreoMessage(null);
          }

          return;
        }

        const data = await res.json();

        const exists: boolean = !!data.exists;
        const matchByCedula: boolean = !!data.matchByCedula;
        const matchByCorreo: boolean = !!data.matchByCorreo;

        // CÉDULA
        if (cedula) {
          if (exists && matchByCedula) {
            setAlegraCedulaStatus("exists");
            setAlegraCedulaMessage(
              "Este cliente ya está registrado en Alegra. Coincidencia por cédula."
            );
          } else {
            setAlegraCedulaStatus("not-found");
            setAlegraCedulaMessage(null);
          }
        } else {
          setAlegraCedulaStatus("idle");
          setAlegraCedulaMessage(null);
        }

        // CORREO
        if (correo) {
          if (exists && matchByCorreo) {
            setAlegraCorreoStatus("exists");
            setAlegraCorreoMessage(
              "Este correo ya está registrado en Alegra."
            );
          } else {
            setAlegraCorreoStatus("not-found");
            setAlegraCorreoMessage(null);
          }
        } else {
          setAlegraCorreoStatus("idle");
          setAlegraCorreoMessage(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(
          "[NewClientForm] Error llamando a /api/alegra/contacts/check:",
          error
        );

        if (form.cedula.trim()) {
          setAlegraCedulaStatus("error");
          setAlegraCedulaMessage("No se pudo validar la cédula en Alegra.");
        }
        if (form.correo.trim()) {
          setAlegraCorreoStatus("error");
          setAlegraCorreoMessage("No se pudo validar el correo en Alegra.");
        }
      }
    }, 500); // pequeño debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [form.cedula, form.correo]);

  // ---- Validación en tiempo real contra DocuSeal (por correo) ----
  useEffect(() => {
    const correo = form.correo.trim();

    if (!correo || !correo.includes("@")) {
      setDocuStatus("idle");
      setDocuMessage(null);
      return;
    }

    let cancelled = false;

    setDocuStatus("checking");
    setDocuMessage("Buscando envíos en DocuSeal...");

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch("/api/docuseal/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: correo }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "[NewClientForm] Error check DocuSeal. status=",
            res.status,
            "body=",
            text
          );
          setDocuStatus("error");
          setDocuMessage("No se pudo validar contra DocuSeal.");
          return;
        }

        const data = await res.json();

        if (data.exists) {
          const count = typeof data.count === "number" ? data.count : 1;
          setDocuStatus("exists");
          setDocuMessage(
            `Este correo ya tiene ${count} documento(s) en DocuSeal.`
          );
        } else {
          setDocuStatus("not-found");
          setDocuMessage(null);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(
          "[NewClientForm] Error llamando a /api/docuseal/check:",
          error
        );
        setDocuStatus("error");
        setDocuMessage("No se pudo validar contra DocuSeal.");
      }
    }, 500); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [form.correo]);

  // Derivado: ¿hay duplicados en Alegra que bloquean el submit?
  const hasAlegraDuplicate =
    alegraCedulaStatus === "exists" || alegraCorreoStatus === "exists";

  // Derivado: resumen “Este correo ya está registrado en Alegra / DocuSeal”
  const correoExistsIn: string[] = [];
  if (alegraCorreoStatus === "exists") correoExistsIn.push("Alegra");
  if (docuStatus === "exists") correoExistsIn.push("DocuSeal");
  const correoSummary =
    correoExistsIn.length > 0
      ? `Este correo ya está registrado en ${correoExistsIn.join(" y ")}.`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Defensa extra: no permitir submit si Alegra dice que ya existe
    if (hasAlegraDuplicate) return;

    setLoading(true);

    try {
      // 1) Guardar en localStorage (Backoffice)
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const existing: Client[] = stored ? JSON.parse(stored) : [];

      const newClient: Client = {
        id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        cedula: form.cedula.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        departamento: DEFAULT_DEPARTAMENTO,
        municipio: DEFAULT_MUNICIPIO,
        createdAt: new Date().toISOString(),
      };

      let newList: Client[] = [...existing, newClient];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

      // 2) DocuSeal (creación de submission)
      try {
        const resp = await fetch("/api/docuseal/submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: newClient }),
        });

        if (!resp.ok) {
          console.error("Error DocuSeal:", resp.status, await resp.text());
        }
      } catch (error) {
        console.error("Error llamando a DocuSeal:", error);
      }

      // 3) Alegra (creación)
      try {
        const alegraResp = await fetch("/api/alegra/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: newClient }),
        });

        if (!alegraResp.ok) {
          console.error("Error Alegra:", alegraResp.status, await alegraResp.text());
        } else {
          const data = await alegraResp.json();
          const alegraId = data?.alegraId as number | undefined;

          if (alegraId) {
            newList = newList.map((c) =>
              c.id === newClient.id ? { ...c, alegraId } : c
            );
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
          }
        }
      } catch (error) {
        console.error("Error llamando a Alegra:", error);
      }

      // 4) Mikrowisp (placeholder)
      try {
        const mwResp = await fetch("/api/microwisp/client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: newClient }),
        });

        const text = await mwResp.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = null;
        }

        if (!mwResp.ok || !data?.ok) {
          console.error("Error Mikrowisp:", mwResp.status, text);
        } else {
          const microwispId = data?.microwispId as number | undefined;
          if (microwispId) {
            newList = newList.map((c) =>
              c.id === newClient.id ? { ...c, microwispId } : c
            );
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
          }
        }
      } catch (error) {
        console.error("Error llamando a Mikrowisp:", error);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error guardando cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-4">
        <span className="inline-flex items-center rounded-full bg-[#ACF227]/15 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-[#ACF227]/50">
          Nuevo registro
        </span>
        <h2 className="mt-3 text-xl font-semibold text-slate-900">
          Datos del cliente
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Completa la información del titular. El sistema validará en Alegra si
          ya existe un contacto con la misma cédula o correo para evitar
          duplicados y te mostrará si el correo ya tiene documentos en DocuSeal
          u otros sistemas.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identificación y datos personales */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Identificación y datos personales
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* CÉDULA */}
            <div>
              <Input
                label="Cédula"
                name="cedula"
                placeholder="Solo números"
                value={form.cedula}
                onChange={handleChange}
                error={errors.cedula}
              />
              {alegraCedulaStatus === "checking" && (
                <p className="mt-1 text-xs text-slate-400">
                  Validando cédula en Alegra...
                </p>
              )}
              {alegraCedulaStatus === "exists" && alegraCedulaMessage && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  {alegraCedulaMessage}
                </p>
              )}
              {alegraCedulaStatus === "error" && alegraCedulaMessage && (
                <p className="mt-1 text-xs text-red-500">
                  {alegraCedulaMessage}
                </p>
              )}
            </div>

            {/* CORREO */}
            <div>
              <Input
                label="Correo"
                name="correo"
                type="email"
                placeholder="alguien@gmail.com"
                value={form.correo}
                onChange={handleChange}
                error={errors.correo}
              />
              {alegraCorreoStatus === "checking" && (
                <p className="mt-1 text-xs text-slate-400">
                  Validando correo en Alegra...
                </p>
              )}
              {correoSummary && (
                <p className="mt-1 text-xs font-medium text-indigo-700">
                  {correoSummary}
                </p>
              )}
              {docuStatus === "checking" && (
                <p className="mt-1 text-xs text-slate-400">
                  Buscando envíos en DocuSeal...
                </p>
              )}
              {docuStatus === "error" && docuMessage && (
                <p className="mt-1 text-xs text-red-500">{docuMessage}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              name="nombre"
              placeholder="Ej: Nombre Usuario"
              value={form.nombre}
              onChange={handleChange}
              error={errors.nombre}
            />
            <Input
              label="Apellido"
              name="apellido"
              placeholder="Ej: Apellido Usuario"
              value={form.apellido}
              onChange={handleChange}
              error={errors.apellido}
            />
          </div>
        </div>

        {/* Contacto y ubicación */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Contacto y ubicación
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Teléfono"
              name="telefono"
              placeholder="3100000000"
              value={form.telefono}
              onChange={handleChange}
            />
            <Input
              label="Dirección"
              name="direccion"
              placeholder="Calle - carrera #00-00"
              value={form.direccion}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Departamento (automático)"
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              disabled
            />
            <Input
              label="Municipio (automático)"
              name="municipio"
              value={form.municipio}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>

        {/* Footer acciones */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-400">
            Al guardar, se creará el cliente en KIVU y se intentará registrar en
            las integraciones configuradas. Si ya existe en Alegra con la misma
            cédula o correo, el sistema bloqueará la creación. Si el correo ya
            tiene documentos en DocuSeal u otros sistemas, se mostrará el aviso
            para que puedas revisarlos.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              className="rounded-full bg-slate-100 px-6 text-slate-700 hover:bg-slate-200"
              onClick={() => router.push("/dashboard")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-full px-6 shadow-md shadow-[#ACF227]/40"
              disabled={
                loading ||
                alegraCedulaStatus === "checking" ||
                alegraCorreoStatus === "checking" ||
                docuStatus === "checking" ||
                hasAlegraDuplicate
              }
            >
              {loading ? "Creando cliente..." : "Crear cliente"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewClientForm;
