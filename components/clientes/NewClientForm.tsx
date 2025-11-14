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

const emptyForm: NewClientFormValues = {
  nombre: "",
  apellido: "",
  cedula: "",
  correo: "",
  telefono: "",
  direccion: "",
  departamento: "",
  municipio: "",
};

const NewClientForm: React.FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<NewClientFormValues>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewClientFormValues, string>>
  >({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        nombre: form.nombre,
        apellido: form.apellido,
        cedula: form.cedula,
        correo: form.correo,
        telefono: form.telefono,
        direccion: form.direccion,
        departamento: form.departamento,
        municipio: form.municipio,
        createdAt: new Date().toISOString(),
      };

      let newList: Client[] = [...existing, newClient];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

      // 2) Integración con DocuSeal
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

      // 3) Integración con Alegra
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
            // Actualizar el cliente recién creado con el alegraId
            newList = newList.map((c) =>
              c.id === newClient.id ? { ...c, alegraId } : c
            );
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
          }
        }
      } catch (error) {
        console.error("Error llamando a Alegra:", error);
      }

      // 4) Volver al dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error guardando cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <header className="mb-6">
            <span className="inline-flex items-center rounded-full bg-[#ACF227]/10 px-3 py-1 text-xs font-semibold text-[#ACF227] ring-1 ring-[#ACF227]/40">
              Nuevo registro
            </span>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">
              Nuevo cliente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Registra un cliente en KIVU. Este formulario también creará el
              cliente en DocuSeal y Alegra.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nombre"
                name="nombre"
                placeholder="Ej: Yuli Angelica"
                value={form.nombre}
                onChange={handleChange}
                error={errors.nombre}
              />
              <Input
                label="Apellido"
                name="apellido"
                placeholder="Ej: Espinel Lara"
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
                placeholder="alguien@kivu.com.co"
                value={form.correo}
                onChange={handleChange}
                error={errors.correo}
              />
            </div>

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
                placeholder="Calle 17 # 17-07"
                value={form.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Departamento"
                name="departamento"
                placeholder="Cundinamarca"
                value={form.departamento}
                onChange={handleChange}
              />
              <Input
                label="Municipio"
                name="municipio"
                placeholder="Arbeláez"
                value={form.municipio}
                onChange={handleChange}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="rounded-full px-6 shadow-md shadow-[#ACF227]/40"
                disabled={loading}
              >
                {loading ? "Creando cliente..." : "Crear cliente"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default NewClientForm;
