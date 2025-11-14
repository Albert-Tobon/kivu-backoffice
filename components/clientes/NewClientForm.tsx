// components/clientes/NewClientForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const STORAGE_KEY = "kivuClients";

interface Client {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
  createdAt: string;
}

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

interface FormErrors {
  [key: string]: string;
}

/**
 * Mapa de departamentos de Colombia -> algunos municipios.
 * Puedes ir agregando más municipios en este objeto.
 */
const COLOMBIA_DATA: Record<string, string[]> = {
  Amazonas: ["Leticia"],
  Antioquia: ["Medellín", "Envigado", "Bello"],
  Arauca: ["Arauca"],
  Atlántico: ["Barranquilla", "Soledad"],
  Bolívar: ["Cartagena de Indias"],
  Boyacá: ["Tunja", "Duitama"],
  Caldas: ["Manizales"],
  Caquetá: ["Florencia"],
  Casanare: ["Yopal"],
  Cauca: ["Popayán"],
  Cesar: ["Valledupar"],
  Chocó: ["Quibdó"],
  "Cundinamarca": ["Arbeláez", "Bogotá D.C.", "Fusagasugá", "Girardot"],
  Córdoba: ["Montería"],
  "Guainía": ["Inírida"],
  "Guaviare": ["San José del Guaviare"],
  Huila: ["Neiva"],
  "La Guajira": ["Riohacha"],
  Magdalena: ["Santa Marta"],
  Meta: ["Villavicencio"],
  Nariño: ["Pasto"],
  "Norte de Santander": ["Cúcuta"],
  Putumayo: ["Mocoa"],
  Quindío: ["Armenia"],
  Risaralda: ["Pereira"],
  Santander: ["Bucaramanga"],
  Sucre: ["Sincelejo"],
  Tolima: ["Ibagué"],
  "Valle del Cauca": ["Cali", "Palmira"],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño"],
};

const DEFAULT_DEPARTAMENTO = "Cundinamarca";
const DEFAULT_MUNICIPIO = "Arbeláez";

export default function NewClientForm() {
  const router = useRouter();

  const [values, setValues] = useState<NewClientFormValues>({
    nombre: "",
    apellido: "",
    cedula: "",
    correo: "",
    telefono: "",
    direccion: "",
    departamento: DEFAULT_DEPARTAMENTO,
    municipio: DEFAULT_MUNICIPIO,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleDepartamentoChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const departamento = e.target.value;
    const municipios = COLOMBIA_DATA[departamento] || [];
    setValues((prev) => ({
      ...prev,
      departamento,
      municipio:
        municipios.length > 0 ? municipios[0] : "",
    }));
    if (errors.departamento || errors.municipio) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.departamento;
        delete copy.municipio;
        return copy;
      });
    }
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    }

    if (!values.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio.";
    }

    if (!values.cedula.trim()) {
      newErrors.cedula = "La cédula es obligatoria.";
    } else if (!/^\d{6,12}$/.test(values.cedula.trim())) {
      newErrors.cedula = "La cédula debe tener solo números (6–12 dígitos).";
    }

    if (!values.correo.trim()) {
      newErrors.correo = "El correo es obligatorio.";
    } else if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
        values.correo.trim()
      )
    ) {
      newErrors.correo = "Correo inválido.";
    }

    if (!values.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio.";
    } else if (!/^3\d{9}$/.test(values.telefono.trim())) {
      newErrors.telefono =
        "Debe ser un celular colombiano (10 dígitos, empieza por 3).";
    }

    if (!values.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria.";
    }

    if (!values.departamento) {
      newErrors.departamento = "Selecciona un departamento.";
    }

    if (!values.municipio) {
      newErrors.municipio = "Selecciona un municipio.";
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;

      const current: Client[] = stored ? JSON.parse(stored) : [];

      const newClient: Client = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        cedula: values.cedula.trim(),
        correo: values.correo.trim(),
        telefono: values.telefono.trim(),
        direccion: values.direccion.trim(),
        departamento: values.departamento,
        municipio: values.municipio,
        createdAt: new Date().toISOString(),
      };

      const updated = [...current, newClient];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      // Ir directo al dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setFormError("No pudimos guardar el cliente. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const departamentos = Object.keys(COLOMBIA_DATA).sort();
  const municipios = COLOMBIA_DATA[values.departamento] || [];

  return (
    <section className="max-w-6xl mx-auto pt-10 pb-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          Nuevo cliente
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Registra un cliente en KIVU. Más adelante este formulario creará el
          cliente también en DocuSeal, MikroWISP y Alegra.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-10 space-y-8"
      >
        {/* Nombre / Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre"
            name="nombre"
            placeholder="Ej: Albert"
            value={values.nombre}
            onChange={handleChange}
            error={errors.nombre}
          />
          <Input
            label="Apellido"
            name="apellido"
            placeholder="Ej: Tobon"
            value={values.apellido}
            onChange={handleChange}
            error={errors.apellido}
          />
        </div>

        {/* Cédula / Correo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Cédula"
            name="cedula"
            placeholder="Solo números"
            value={values.cedula}
            onChange={handleChange}
            error={errors.cedula}
          />
          <Input
            label="Correo"
            name="correo"
            placeholder="alguien@kivu.com.co"
            value={values.correo}
            onChange={handleChange}
            error={errors.correo}
          />
        </div>

        {/* Teléfono / Dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Teléfono"
            name="telefono"
            placeholder="3100000000"
            value={values.telefono}
            onChange={handleChange}
            error={errors.telefono}
          />
          <Input
            label="Dirección"
            name="direccion"
            placeholder="Calle 17 # 17-07"
            value={values.direccion}
            onChange={handleChange}
            error={errors.direccion}
          />
        </div>

        {/* Departamento / Municipio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Departamento
            </label>
            <select
              name="departamento"
              value={values.departamento}
              onChange={handleDepartamentoChange}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
            >
              {departamentos.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
            {errors.departamento && (
              <p className="mt-1 text-xs text-red-500">
                {errors.departamento}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Municipio
            </label>
            <select
              name="municipio"
              value={values.municipio}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 outline-none"
            >
              {municipios.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
            {errors.municipio && (
              <p className="mt-1 text-xs text-red-500">{errors.municipio}</p>
            )}
          </div>
        </div>

        {/* Error general */}
        {formError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        {/* Botones */}
        <div className="flex justify-end">
          <Button type="submit" fullWidth={false} disabled={loading}>
            {loading ? "Creando cliente..." : "Crear cliente"}
          </Button>
        </div>
      </form>
    </section>
  );
}
