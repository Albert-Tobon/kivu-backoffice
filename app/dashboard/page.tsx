// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";

const STORAGE_KEY = "kivuClients";

interface Client {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento?: string;
  municipio?: string;
  createdAt?: string;
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setClients(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error leyendo clientes:", error);
    }
  }, []);

  const handleView = (id: string) => {
    if (selectedClientId === id && showDetails) {
      setShowDetails(false);
      setSelectedClientId(null);
    } else {
      setSelectedClientId(id);
      setShowDetails(true);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este cliente?")) return;

    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (selectedClientId === id) {
      setSelectedClientId(null);
      setShowDetails(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="max-w-6xl mx-auto pt-10 pb-16">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Bienvenido al Backoffice de KIVU
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Aquí verás tus clientes y podrás crear nuevos que luego se
              sincronizarán con DocuSeal, MikroWISP y Alegra.
            </p>
          </div>

          <Link href="/clientes/nuevo">
            <Button>+ Nuevo cliente</Button>
          </Link>
        </header>

        {/* Tabla de clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Cédula</th>
                <th className="px-6 py-3">Correo</th>
                <th className="px-6 py-3">Teléfono</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No hay clientes registrados aún. Crea el primero con el
                    botón{" "}
                    <span className="font-semibold text-slate-700">
                      &quot;Nuevo cliente&quot;
                    </span>
                    .
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-3 text-slate-800">
                      {client.nombre} {client.apellido}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {client.cedula}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {client.correo}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {client.telefono}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString(
                            "es-CO"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          onClick={() => handleView(client.id)}
                        >
                          {selectedClientId === client.id && showDetails
                            ? "Ocultar"
                            : "Ver"}
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-1 text-xs"
                          onClick={() => handleDelete(client.id)}
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
        </div>

        {/* Panel de detalle */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Detalle del cliente
              </h2>

              {selectedClient && (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {selectedClient.municipio
                    ? `${selectedClient.municipio} · ${
                        selectedClient.departamento ?? ""
                      }`
                    : selectedClient.departamento
                    ? `Sin municipio · ${selectedClient.departamento}`
                    : "Sin municipio"}
                </span>
              )}
            </div>

            {!showDetails || !selectedClient ? (
              <p className="text-sm text-slate-500">
                Selecciona un cliente y pulsa{" "}
                <span className="font-medium">&quot;Ver&quot;</span> para ver
                sus datos.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-16 text-sm text-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    NOMBRE COMPLETO
                  </p>
                  <p className="mt-1">
                    {selectedClient.nombre} {selectedClient.apellido}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">CÉDULA</p>
                  <p className="mt-1">{selectedClient.cedula}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    CORREO
                  </p>
                  <p className="mt-1">{selectedClient.correo}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    TELÉFONO
                  </p>
                  <p className="mt-1">{selectedClient.telefono}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    DIRECCIÓN
                  </p>
                  <p className="mt-1">{selectedClient.direccion}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    MUNICIPIO / DEPARTAMENTO
                  </p>
                  <p className="mt-1">
                    {selectedClient.municipio
                      ? `${selectedClient.municipio} - ${
                          selectedClient.departamento ?? ""
                        }`
                      : `- ${selectedClient.departamento ?? ""}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
