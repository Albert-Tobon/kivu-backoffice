// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Button from "../../components/ui/button";
import EditClientForm from "../../components/clientes/EditClientForm";
import type { Client } from "../../components/clientes/types";
import { STORAGE_KEY } from "../../components/clientes/types";

type SortMode = "date-desc" | "name-asc" | "name-desc";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date-desc");

  // Cargar clientes desde localStorage + Alegra
  useEffect(() => {
    if (typeof window === "undefined") return;

    let localClients: Client[] = [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        localClients = JSON.parse(stored);
        setClients(localClients);
      } catch (error) {
        console.error("Error leyendo clientes de localStorage:", error);
      }
    }

    const fetchAlegraClients = async () => {
      try {
        const res = await fetch("/api/alegra/contacts", { method: "GET" });
        const json = await res.json();

        if (!res.ok || !json.ok || !Array.isArray(json.clients)) {
          console.error("Error al cargar clientes desde Alegra:", json);
          return;
        }

        const alegraClients: Client[] = json.clients.map((c: any) => {
          const fullName: string = c.name ?? "";
          const [nombre, ...rest] = fullName.split(" ");
          const apellido = rest.join(" ");

          return {
            id: c.id?.toString() ?? crypto.randomUUID(),
            nombre: nombre || c.nombre || "",
            apellido: apellido || c.apellido || "",
            cedula: c.document ?? c.cedula ?? "",
            correo: c.email ?? c.correo ?? "",
            telefono: c.phone ?? c.telefono ?? "",
            departamento: c.department ?? c.departamento ?? "",
            municipio: c.city ?? c.municipio ?? "",
            direccion: c.address ?? c.direccion ?? "",
            createdAt:
              c.createdAt ?? c.creationDate ?? new Date().toISOString(),
            alegraId: c.id?.toString() ?? c.alegraId ?? undefined,
          } as Client;
        });

        const merged: Client[] = [...alegraClients];

        for (const local of localClients) {
          const alreadyExists = merged.some((remote) => {
            if (remote.alegraId && local.alegraId) {
              return remote.alegraId === local.alegraId;
            }
            if (remote.cedula && local.cedula) {
              return remote.cedula === local.cedula;
            }
            return false;
          });

          if (!alreadyExists) {
            merged.push(local);
          }
        }

        // Orden inicial por fecha de creación (más nuevos primero)
        merged.sort((a, b) => {
          const da = new Date(a.createdAt).getTime() || 0;
          const db = new Date(b.createdAt).getTime() || 0;
          return db - da;
        });

        setClients(merged);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch (error) {
        console.error("Error llamando a /api/alegra/contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlegraClients();
  }, []);

  // Cliente seleccionado (objeto completo)
  const selectedClient =
    clients.find((c) => c.id === selectedClientId) ?? null;

  const handleView = (id: string) => {
    setSelectedClientId((current) => (current === id ? null : id));
    setEditing(false);
  };

  // Eliminar (aún sin validación de facturas; eso lo hacemos después)
  const handleDelete = async (id: string) => {
    const confirmed = confirm(
      "¿Seguro que quieres eliminar este cliente? Esto también archivará su contrato en DocuSeal e intentará eliminarlo en Alegra."
    );
    if (!confirmed) return;

    const clientToDelete = clients.find((c) => c.id === id);

    if (clientToDelete) {
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

    const newList = clients.filter((c) => c.id !== id);
    setClients(newList);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    }

    if (selectedClientId === id) {
      setSelectedClientId(null);
      setEditing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  // Filtro + ordenamiento
  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = [...clients];

    if (q) {
      list = list.filter((c) => {
        return (
          `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
          c.cedula?.toString().toLowerCase().includes(q) ||
          c.correo?.toLowerCase().includes(q) ||
          c.telefono?.toLowerCase().includes(q)
        );
      });
    }

    // Ordenamiento según sortMode
    list.sort((a, b) => {
      if (sortMode === "name-asc" || sortMode === "name-desc") {
        const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
        if (nameA < nameB) return sortMode === "name-asc" ? -1 : 1;
        if (nameA > nameB) return sortMode === "name-asc" ? 1 : -1;
        return 0;
      }

      // date-desc (default) → más nuevos primero
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });

    return list;
  }, [search, clients, sortMode]);

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* Encabezado compacto */}
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-full bg-[#ACF227]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#4c5a00] ring-1 ring-[#ACF227]/60">
              Backoffice KIVU
            </span>
            <h1 className="text-xl font-semibold text-slate-900">
              Gestión de clientes
            </h1>
            <p className="text-xs text-slate-600">
              Administra tus clientes, edita su información y mantén tu
              operación sincronizada con tus sistemas.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula, correo o teléfono..."
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-lime-400 focus:ring-1 focus:ring-lime-300"
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                  onClick={() => setSearch("")}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Selector de orden */}
            <div className="flex items-center gap-2">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm outline-none transition focus:border-lime-400 focus:ring-1 focus:ring-lime-300"
              >
                <option value="date-desc">Más recientes primero</option>
                <option value="name-asc">Nombre A–Z</option>
                <option value="name-desc">Nombre Z–A</option>
              </select>

              <Link href="/clientes/nuevo">
                <Button className="rounded-full px-3 py-1 text-xs shadow-sm shadow-[#ACF227]/40">
                  + Nuevo
                </Button>
              </Link>

              <Button
                className="rounded-full bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-900"
                onClick={handleLogout}
              >
                Salir
              </Button>
            </div>
          </div>
        </header>

        {/* Tabla de clientes + detalle inline */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Cédula
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Teléfono
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && clients.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-xs text-slate-500"
                  >
                    Cargando clientes desde Alegra...
                  </td>
                </tr>
              )}

              {filteredClients.map((c, index) => {
                const isSelected = c.id === selectedClientId;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      className={`transition-colors ${
                        isSelected ? "bg-slate-50" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-3 py-2 text-center text-[11px] text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {c.nombre} {c.apellido}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.cedula || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.correo || "-"}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {c.telefono || "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString("es-CO")}
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-full bg-[#ACF227] px-3 py-0.5 text-[11px] text-slate-900 hover:bg-[#bdfb39]"
                            onClick={() => handleView(c.id)}
                          >
                            {isSelected ? "Ocultar" : "Ver"}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            className="rounded-full bg-red-500 px-3 py-0.5 text-[11px] text-white hover:bg-red-600"
                            onClick={() => handleDelete(c.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Detalle inline debajo de la fila */}
                    {isSelected && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-5 pb-4 pt-1">
                          <div className="mt-1 rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                  Detalle del cliente
                                </h2>
                                <p className="mt-0.5 text-[11px] text-slate-600">
                                  Información del cliente seleccionado
                                  (sincronizado con Alegra).
                                </p>
                              </div>
                              <Button
                                className="rounded-full bg-[#ACF227] px-3 py-0.5 text-[11px] font-semibold text-slate-900 hover:bg-[#bdfb39]"
                                onClick={() => setEditing(true)}
                              >
                                Editar
                              </Button>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Nombre completo
                                </h4>
                                <p className="mt-0.5 text-sm font-medium text-slate-900">
                                  {c.nombre} {c.apellido}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Cédula
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.cedula || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Correo
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.correo || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Teléfono
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.telefono || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Departamento
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.departamento || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Municipio
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.municipio || "-"}
                                </p>
                              </div>

                              <div className="md:col-span-2">
                                <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Dirección
                                </h4>
                                <p className="mt-0.5 text-sm text-slate-900">
                                  {c.direccion || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {!loading && filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-xs text-slate-500"
                  >
                    No se encontraron clientes con el criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Formulario de edición (debajo de la tabla, reutilizando tu componente) */}
        {editing && selectedClient && (
          <EditClientForm
            client={selectedClient}
            onCancel={() => setEditing(false)}
            onSave={(updated) => {
              const newList = clients.map((c) =>
                c.id === updated.id ? updated : c
              );
              setClients(newList);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(newList)
                );
              }
              setEditing(false);
            }}
          />
        )}
      </div>
    </main>
  );
}
