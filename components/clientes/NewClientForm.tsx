"use client";

// components/clientes/NewClientForm.tsx
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface NewClientFormValues {
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
}

interface StoredClient extends NewClientFormValues {
  id: string;
  createdAt: string;
}

const CLIENTS_KEY = "kivu:clientes";

export const NewClientForm: React.FC = () => {
  const [values, setValues] = useState<NewClientFormValues>({
    nombre: "",
    apellido: "",
    cedula: "",
    correo: "",
    telefono: "",
    direccion: "",
  });

  const [errors, setErrors] = useState<Partial<NewClientFormValues>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ---------------- VALIDACIÓN ----------------
  const validate = () => {
    const newErrors: Partial<NewClientFormValues> = {};

    // Nombre y apellido
    if (!values.nombre.trim()) newErrors.nombre = "Nombre obligatorio";
    if (!values.apellido.trim()) newErrors.apellido = "Apellido obligatorio";

    // Cédula: solo números 6–15 dígitos
    if (!values.cedula.trim()) {
      newErrors.cedula = "Cédula obligatoria";
    } else if (!/^[0-9]{6,15}$/.test(values.cedula.trim())) {
      newErrors.cedula =
        "La cédula debe contener solo números (entre 6 y 15 dígitos).";
    }

    // Correo válido
    if (!values.correo.trim()) {
      newErrors.correo = "Correo obligatorio";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.correo.trim())) {
        newErrors.correo = "Ingresa un correo válido (ej: usuario@dominio.com).";
      }
    }

    // Teléfono Colombia: 10 dígitos y empieza por 3
    if (!values.telefono.trim()) {
      newErrors.telefono = "Teléfono obligatorio";
    } else if (!/^3[0-9]{9}$/.test(values.telefono.trim())) {
      newErrors.telefono =
        "Teléfono inválido. Debe ser celular colombiano (10 dígitos y empezar por 3).";
    }

    // Dirección
    if (!values.direccion.trim()) {
      newErrors.direccion = "Dirección obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --------------- MANEJO DE INPUTS ---------------
  const handleChange =
    (field: keyof NewClientFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // --------------- SUBMIT ---------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    try {
      setLoading(true);

      // Simulación de delay
      await new Promise((res) => setTimeout(res, 500));

      // Guardar en localStorage
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(CLIENTS_KEY);
        const existing: StoredClient[] = stored ? JSON.parse(stored) : [];

        const newClient: StoredClient = {
          ...values,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
        };

        existing.push(newClient);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(existing));
      }

      setMessage("Cliente creado (local). Más adelante lo enviaremos a las APIs.");
      setValues({
        nombre: "",
        apellido: "",
        cedula: "",
        correo: "",
        telefono: "",
        direccion: "",
      });
      setErrors({});
    } catch (error) {
      console.error(error);
      setMessage("Ocurrió un error al crear el cliente.");
    } finally {
      setLoading(false);
    }
  };

  // --------------- UI ---------------
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Nuevo cliente
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Registra un cliente en KIVU. Más adelante este formulario creará el
          cliente también en DocuSeal, MikroWISP y Alegra.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow-lg md:grid-cols-2"
        >
          <div>
            <Input
              label="Nombre"
              value={values.nombre}
              onChange={handleChange("nombre")}
              error={errors.nombre}
            />
          </div>

          <div>
            <Input
              label="Apellido"
              value={values.apellido}
              onChange={handleChange("apellido")}
              error={errors.apellido}
            />
          </div>

          <div>
            <Input
              label="Cédula"
              value={values.cedula}
              onChange={handleChange("cedula")}
              error={errors.cedula}
            />
          </div>

          <div>
            <Input
              label="Correo"
              type="email"
              value={values.correo}
              onChange={handleChange("correo")}
              error={errors.correo}
            />
          </div>

          <div>
            <Input
              label="Teléfono"
              value={values.telefono}
              onChange={handleChange("telefono")}
              error={errors.telefono}
            />
          </div>

          <div>
            <Input
              label="Dirección"
              value={values.direccion}
              onChange={handleChange("direccion")}
              error={errors.direccion}
            />
          </div>

          <div className="mt-4 md:col-span-2">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creando cliente..." : "Crear cliente"}
            </Button>

            {message && (
              <p className="mt-3 text-sm text-slate-600">{message}</p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
};
