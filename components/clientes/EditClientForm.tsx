// components/clientes/EditClientForm.tsx
"use client";

import React, { useState } from "react";
import Button from "../ui/button";
import { Input } from "../ui/input";
import type { Client } from "./types";

interface EditClientFormProps {
  client: Client;
  onSave: (updated: Client) => void;
  onCancel: () => void;
}

const EditClientForm: React.FC<EditClientFormProps> = ({
  client,
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState<Client>(client);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Editar cliente
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Actualiza la información del cliente seleccionado.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
        />
        <Input
          label="Apellido"
          name="apellido"
          value={form.apellido}
          onChange={handleChange}
        />
        <Input
          label="Correo"
          name="correo"
          type="email"
          value={form.correo}
          onChange={handleChange}
        />
        <Input
          label="Teléfono"
          name="telefono"
          value={form.telefono}
          onChange={handleChange}
        />
        <Input
          label="Cédula"
          name="cedula"
          value={form.cedula}
          onChange={handleChange}
        />
        <Input
          label="Dirección"
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
        />
        <Input
          label="Departamento"
          name="departamento"
          value={form.departamento}
          onChange={handleChange}
        />
        <Input
          label="Municipio"
          name="municipio"
          value={form.municipio}
          onChange={handleChange}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          className="rounded-full px-5"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="rounded-full px-5 shadow-md shadow-[#ACF227]/40"
          onClick={handleSave}
        >
          Guardar cambios
        </Button>
      </div>
    </section>
  );
};

export default EditClientForm;
