// components/clientes/NewClientForm.tsx
"use client";

import React, { useState } from "react";
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

// 🔒 Valores fijos / automáticos
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!form.apellido.trim()) newErrors.apellido = "El apellido es obligatorio";
    if (!form.cedula.trim()) newErrors.cedula = "La cédula es obligatoria";
    if (!form.correo.trim()) newErrors.correo = "El correo es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
        // siempre usamos los valores fijos
        departamento: DEFAULT_DEPARTAMENTO,
        municipio: DEFAULT_MUNICIPIO,
        createdAt: new Date().toISOString(),
      };

      let newList: Client[] = [...existing, newClient];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

      // 2) DocuSeal
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

      // 3) Alegra
      try {
        const alegraResp = await fetch("/api/alegra/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client: newClient }),
        });

        if (!alegraResp.ok) {
          console.error(
            "Error Alegra:",
            alegraResp.status,
            await alegraResp.text()
          );
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

      // 4) Mikrowisp
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

      // 5) Volver al dashboard
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
          Completa la información del titular. Luego el sistema intentará
          sincronizar con las plataformas conectadas.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos personales */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            Datos personales
          </h3>
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

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cédula"
              name="cedula"
              placeholder="Solo números"
              value={form.cedula}
              onChange={handleChange}
              error={errors.cedula}
            />
            <Input
              label="Correo"
              name="correo"
              type="email"
              placeholder="alguien@gmail.com"
              value={form.correo}
              onChange={handleChange}
              error={errors.correo}
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

          {/* Departamento y municipio fijos/automáticos */}
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
            las integraciones configuradas.
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
              disabled={loading}
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
