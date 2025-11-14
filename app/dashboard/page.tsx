"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StoredClient {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  createdAt: string;
}

const CLIENTS_KEY = "kivu:clientes";

export default function DashboardPage() {
  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CLIENTS_KEY);
      if (stored) {
        setClients(JSON.parse(stored));
      }
    }
  }, []);

  const handleView = (client: StoredClient) => {
    setSelectedClient(client);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;

    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id);

      if (typeof window !== "undefined") {
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
      }

      // Si el que estaba seleccionado era este, lo limpiamos
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient(null);
      }

      return updated;
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Bienvenido al Backoffice de KIVU
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Aquí verás tus clientes y podrás crear nuevos que luego se
              sincronizarán con DocuSeal, MikroWISP y Alegra.
            </p>
          </div>

          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + Nuevo cliente
          </Link>
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-md">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No hay clientes registrados aún. Crea el primero con el
                    botón &quot;Nuevo cliente&quot;.
                  </td>
                </tr>
              )}

              {clients.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    {c.nombre} {c.apellido}
                  </td>
                  <td className="px-4 py-3">{c.cedula}</td>
                  <td className="px-4 py-3">{c.correo}</td>
                  <td className="px-4 py-3">{c.telefono}</td>
                  <td className="px-4 py-3">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(c)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedClient && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">
              Detalle del cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Información rápida del cliente seleccionado.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Nombre completo
                </p>
                <p className="text-sm text-slate-800">
                  {selectedClient.nombre} {selectedClient.apellido}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Cédula
                </p>
                <p className="text-sm text-slate-800">
                  {selectedClient.cedula}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Correo
                </p>
                <p className="text-sm text-slate-800">
                  {selectedClient.correo}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Teléfono
                </p>
                <p className="text-sm text-slate-800">
                  {selectedClient.telefono}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Dirección
                </p>
                <p className="text-sm text-slate-800">
                  {selectedClient.direccion}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
