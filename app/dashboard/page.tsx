// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "../../components/ui/button";
import EditClientForm from "../../components/clientes/EditClientForm";
import type { Client } from "../../components/clientes/types";
import { STORAGE_KEY } from "../../components/clientes/types";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch (error) {
        console.error("Error leyendo clientes:", error);
      }
    }
  }, []);

  const selectedClient =
    clients.find((c) => c.id === selectedClientId) || null;

  const handleView = (id: string) => {
    setSelectedClientId(id);
    setShowDetails(true);
    setEditing(false);
  };

  const handleDelete = (id: string) => {
    const confirmed = confirm("¿Seguro que quieres eliminar este cliente?");
    if (!confirmed) return;

    const newList = clients.filter((c) => c.id !== id);
    setClients(newList);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

    if (selectedClientId === id) {
      setSelectedClientId(null);
      setShowDetails(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#ACF227]/10 px-3 py-1 text-xs font-semibold text-[#ACF227] ring-1 ring-[#ACF227]/40">
              Backoffice KIVU
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Gestión de clientes
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Administra tus clientes, edita su información y mantén tu
              operación sincronizada con tus sistemas.
            </p>
          </div>

          <Link href="/clientes/nuevo">
            <Button className="rounded-full px-5 py-2 text-sm font-semibold shadow-md shadow-[#ACF227]/40">
              + Nuevo cliente
            </Button>
          </Link>
        </header>

        {/* Tabla */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-sm text-slate-500"
                  >
                    No hay clientes registrados. Crea uno nuevo para comenzar.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {c.nombre} {c.apellido}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {c.cedula}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {c.correo}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {c.telefono}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(c.createdAt).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="rounded-full text-xs font-semibold"
                          onClick={() => handleView(c.id)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="rounded-full text-xs font-semibold"
                          onClick={() => handleDelete(c.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Mensaje inicial */}
        {!showDetails && (
          <section className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-md ring-1 ring-slate-200">
            Selecciona un cliente de la tabla para ver sus detalles o editarlo.
          </section>
        )}

        {/* Detalle del cliente */}
        {showDetails && selectedClient && !editing && (
          <section className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Detalle del cliente
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Información rápida del cliente seleccionado.
                </p>
              </div>
              <Button
                className="rounded-full px-4 py-2 text-sm font-semibold"
                onClick={() => setEditing(true)} // 🔧 AQUÍ SE ARREGLA
              >
                Editar cliente
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre completo
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.nombre} {selectedClient.apellido}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cédula
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.cedula}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.correo}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teléfono
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.telefono}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Departamento
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.departamento}
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Municipio
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.municipio}
                </p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dirección
                </h4>
                <p className="text-sm text-slate-900">
                  {selectedClient.direccion}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Formulario de edición */}
        {editing && selectedClient && (
          <EditClientForm
            client={selectedClient}
            onCancel={() => setEditing(false)}
            onSave={(updated) => {
              const newList = clients.map((c) =>
                c.id === updated.id ? updated : c
              );
              setClients(newList);
              window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(newList)
              );
              setEditing(false);
            }}
          />
        )}
      </div>
    </main>
  );
}
