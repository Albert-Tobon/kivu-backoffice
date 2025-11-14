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

  // Cargar clientes desde localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setClients(JSON.parse(stored));
      } catch (error) {
        console.error("Error leyendo clientes:", error);
      }
    }
  }, []);

  // Cliente seleccionado (objeto completo)
  const selectedClient =
    clients.find((c) => c.id === selectedClientId) ?? null;

  // Manejo botón VER
  const handleView = (id: string) => {
    setSelectedClientId(id);
    setShowDetails(true);
    setEditing(false);
  };

  // Manejo botón ELIMINAR (DocuSeal + Alegra + local)
  const handleDelete = async (id: string) => {
    const confirmed = confirm(
      "¿Seguro que quieres eliminar este cliente? Esto también archivará su contrato en DocuSeal e intentará eliminarlo en Alegra."
    );
    if (!confirmed) return;

    const clientToDelete = clients.find((c) => c.id === id);

    if (clientToDelete) {
      // 1) DocuSeal
      try {
        await fetch("/api/docuseal/submission", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientId: clientToDelete.id }),
        });
      } catch (err) {
        console.error("Error archivando submission en DocuSeal:", err);
      }

      // 2) Alegra (solo si tenemos alegraId)
      if (clientToDelete.alegraId) {
        try {
          await fetch("/api/alegra/contact", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ alegraId: clientToDelete.alegraId }),
          });
        } catch (err) {
          console.error("Error eliminando contacto en Alegra:", err);
        }
      }
    }

    // 3) Actualizar lista local
    const newList = clients.filter((c) => c.id !== id);
    setClients(newList);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));

    if (selectedClientId === id) {
      setSelectedClientId(null);
      setShowDetails(false);
      setEditing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Encabezado */}
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#ACF227]/10 px-3 py-1 text-xs font-semibold text-[#4c5a00] ring-1 ring-[#ACF227]/60">
              Backoffice KIVU
            </span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Gestión de clientes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Administra tus clientes, edita su información y mantén tu
              operación sincronizada con tus sistemas.
            </p>
          </div>

          <Link href="/clientes/nuevo">
            <Button className="rounded-full px-5 shadow-md shadow-[#ACF227]/40">
              + Nuevo cliente
            </Button>
          </Link>
        </header>

        {/* Tabla de clientes */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {c.nombre} {c.apellido}
                  </td>
                  <td className="px-6 py-3 text-slate-700">{c.cedula}</td>
                  <td className="px-6 py-3 text-slate-700">{c.correo}</td>
                  <td className="px-6 py-3 text-slate-700">{c.telefono}</td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("es-CO")}
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-full bg-[#ACF227] text-slate-900 hover:bg-[#bdfb39]"
                        onClick={() => handleView(c.id)}
                      >
                        Ver
                      </Button>

                        <Button
                        variant="danger"
                        size="sm"
                        className="rounded-full bg-red-500 text-white hover:bg-red-600"
                        onClick={() => handleDelete(c.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {clients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Todavía no tienes clientes registrados. Crea el primero con
                    el botón &quot;Nuevo cliente&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Mensaje inicial */}
        {!showDetails && !editing && clients.length > 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-md ring-1 ring-slate-200">
            Selecciona un cliente de la tabla para ver sus detalles o editarlo.
          </div>
        )}

        {/* Detalle del cliente */}
        {showDetails && selectedClient && !editing && (
          <section className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Detalle del cliente
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Información rápida del cliente seleccionado.
                </p>
              </div>
              <Button
                className="rounded-full bg-[#ACF227] px-5 text-slate-900 hover:bg-[#bdfb39]"
                onClick={() => setEditing(true)}
              >
                Editar cliente
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nombre completo
                </h4>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedClient.nombre} {selectedClient.apellido}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cédula
                </h4>
                <p className="mt-1 text-slate-900">{selectedClient.cedula}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </h4>
                <p className="mt-1 text-slate-900">{selectedClient.correo}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teléfono
                </h4>
                <p className="mt-1 text-slate-900">{selectedClient.telefono}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Departamento
                </h4>
                <p className="mt-1 text-slate-900">
                  {selectedClient.departamento}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Municipio
                </h4>
                <p className="mt-1 text-slate-900">{selectedClient.municipio}</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dirección
                </h4>
                <p className="mt-1 text-slate-900">
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
