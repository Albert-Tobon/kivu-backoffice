// app/dashboard/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Button from "../../components/ui/button";
import EditClientForm from "../../components/clientes/EditClientForm";
import type { Client } from "../../components/clientes/types";
import { STORAGE_KEY } from "../../components/clientes/types";

// Estado de integraciones (Alegra / DocuSeal / Mikrowisp)
import IntegrationToggles from "../api/integrations/status/IntegrationToggles";

type SortMode = "date-desc" | "name-asc" | "name-desc";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode] = useState<SortMode>("date-desc"); // siempre "más recientes"
  const [isDark, setIsDark] = useState(false);

  /* =========================
   *   TEMA (modo oscuro)
   * ========================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("kivu-theme");
    if (stored === "dark") setIsDark(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kivu-theme", isDark ? "dark" : "light");
  }, [isDark]);

  /* =========================
   *   CARGA DE CLIENTES
   * ========================= */
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

          if (!alreadyExists) merged.push(local);
        }

        // más nuevos primero
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

  /* =========================
   *   SELECCIÓN / EDICIÓN
   * ========================= */
  const selectedClient =
    clients.find((c) => c.id === selectedClientId) ?? null;

  const handleView = (id: string) => {
    setSelectedClientId((current) => (current === id ? null : id));
    setEditing(false);
  };

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
          headers: { "Content-Type": "application/json" },
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

  /* =========================
   *   FILTRO + ORDEN
   * ========================= */
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

    list.sort((a, b) => {
      if (sortMode === "name-asc" || sortMode === "name-desc") {
        const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
        const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
        if (nameA < nameB) return sortMode === "name-asc" ? -1 : 1;
        if (nameA > nameB) return sortMode === "name-asc" ? 1 : -1;
        return 0;
      }

      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });

    return list;
  }, [search, clients, sortMode]);

  const totalClients = filteredClients.length;
  const visibleClients = filteredClients; // SIN paginación

  // Súper compacto
  const rowBaseClasses =
    "h-5 align-middle text-[10px] leading-[1] whitespace-nowrap transition-colors";
  const cellBaseClasses = "px-1 py-0 align-middle";

  const mainBg = isDark
    ? "bg-slate-900 text-slate-100"
    : "bg-slate-50 text-slate-900";
  const cardBase = isDark
    ? "bg-slate-800/95 ring-slate-700"
    : "bg-white/95 ring-slate-200";
  const tableCardBase = isDark
    ? "bg-slate-800 ring-slate-700"
    : "bg-white ring-slate-200";

  /* =========================
   *   RENDER
   * ========================= */
  return (
    <main className={`min-h-screen px-3 py-5 transition-colors ${mainBg}`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {/* HEADER + INTEGRACIONES STICKY JUNTOS */}
        <div className="sticky top-0 z-30 space-y-3 backdrop-blur">
          {/* Header card */}
          <section
            className={`rounded-xl px-4 py-4 shadow-sm ring-1 md:px-6 md:py-5 ${cardBase}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Lado izquierdo: título + descripción + total */}
              <div className="space-y-1">
                <span className="inline-flex items-center h-9 rounded-md bg-[#ACF227] px-4 text-sm font-semibold text-[#111] cursor-default hover:bg-[#c7ff3f] transition">
  Backoffice KIVU
</span>
                <h1 className="text-lg font-semibold">Gestión de clientes</h1>
                <p className="text-[11px] text-slate-400">
                  Administra tus clientes, edita su información y mantén tu
                  operación sincronizada con tus sistemas.
                </p>
                <p className="text-[10px] text-slate-400">
                  Total de clientes:{" "}
                  <span className="font-semibold text-slate-200">
                    {totalClients}
                  </span>
                </p>
              </div>

              {/* Lado derecho: buscador + controles */}
              <div className="flex w-full flex-col gap-2 md:w-[420px]">
                {/* Buscador */}
                <div className="relative w-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, cédula, correo o teléfono..."
                    className={`w-full rounded-full border px-3 py-1 text-[11px] shadow-sm outline-none transition focus:border-lime-400 focus:ring-1 focus:ring-lime-300 ${
                      isDark
                        ? "border-slate-600 bg-slate-900/70 text-slate-100 placeholder:text-slate-500"
                        : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                    }`}
                  />
                  {search && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 hover:text-slate-200"
                      onClick={() => setSearch("")}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Controles: modo oscuro + botones */}
                <div className="flex items-center justify-end gap-2">
                  {/* Switch modo oscuro */}
                  <button
                    type="button"
                    onClick={() => setIsDark((v) => !v)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${
                      isDark
                        ? "border-slate-500 bg-slate-700 text-slate-100"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>{isDark ? "Modo oscuro" : "Modo claro"}</span>
                    <span
                      className={`flex h-4 w-7 items-center rounded-full ${
                        isDark ? "bg-slate-900" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
                          isDark ? "translate-x-3" : "translate-x-1"
                        }`}
                      />
                    </span>
                  </button>

                  <Link href="/clientes/nuevo">
                    <Button className="rounded-full px-3 py-1 text-[10px] shadow-sm shadow-[#ACF227]/40">
                      + Nuevo
                    </Button>
                  </Link>

                  <Button
                    className="rounded-full bg-slate-800 px-3 py-1 text-[10px] text-white hover:bg-slate-900"
                    onClick={handleLogout}
                  >
                    Salir
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Integraciones también fijas */}
          <IntegrationToggles />
        </div>

        {/* Tabla de clientes (sin paginación) */}
        <section
          className={`overflow-x-auto rounded-xl shadow-sm ring-1 ${tableCardBase}`}
        >
          <table className="min-w-full divide-y text-[10px]">
            <thead
              className={
                isDark
                  ? "bg-slate-900/90 text-slate-300"
                  : "bg-slate-100 text-slate-600"
              }
            >
              <tr className="h-5">
                <th
                  className={`${cellBaseClasses} w-[36px] text-center text-[9px] font-semibold uppercase tracking-wide`}
                >
                  #
                </th>
                <th
                  className={`${cellBaseClasses} w-[210px] text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Nombre
                </th>
                <th
                  className={`${cellBaseClasses} w-[110px] text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Cédula
                </th>
                <th
                  className={`${cellBaseClasses} text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Correo
                </th>
                <th
                  className={`${cellBaseClasses} w-[120px] text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Teléfono
                </th>
                <th
                  className={`${cellBaseClasses} w-[95px] text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Fecha
                </th>
                <th
                  className={`${cellBaseClasses} w-[110px] text-left text-[9px] font-semibold uppercase tracking-wide`}
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y ${
                isDark ? "divide-slate-700" : "divide-slate-100"
              }`}
            >
              {loading && clients.length === 0 && (
                <tr className={rowBaseClasses}>
                  <td
                    colSpan={7}
                    className={`${cellBaseClasses} text-center text-[10px] ${
                      isDark ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Cargando clientes desde Alegra...
                  </td>
                </tr>
              )}

              {visibleClients.map((c, index) => {
                const isSelected = c.id === selectedClientId;
                const rowColor = isSelected
                  ? isDark
                    ? "bg-slate-700"
                    : "bg-slate-50"
                  : isDark
                  ? "hover:bg-slate-700/70"
                  : "hover:bg-slate-50/70";

                return (
                  <React.Fragment key={c.id}>
                    <tr className={`${rowBaseClasses} ${rowColor}`}>
                      <td
                        className={`${cellBaseClasses} text-center text-[10px] ${
                          isDark ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </td>
                      <td
                        className={`${cellBaseClasses} truncate font-medium ${
                          isDark ? "text-slate-50" : "text-slate-900"
                        }`}
                        title={`${c.nombre} ${c.apellido}`}
                      >
                        {c.nombre} {c.apellido}
                      </td>
                      <td
                        className={`${cellBaseClasses} truncate ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                        title={c.cedula || "-"}
                      >
                        {c.cedula || "-"}
                      </td>
                      <td
                        className={`${cellBaseClasses} truncate ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                        title={c.correo || "-"}
                      >
                        {c.correo || "-"}
                      </td>
                      <td
                        className={`${cellBaseClasses} truncate ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                        title={c.telefono || "-"}
                      >
                        {c.telefono || "-"}
                      </td>
                      <td
                        className={`${cellBaseClasses} truncate text-[10px] ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                        title={
                          c.createdAt
                            ? new Date(c.createdAt).toLocaleString("es-CO")
                            : "-"
                        }
                      >
                        {new Date(c.createdAt).toLocaleDateString("es-CO")}
                      </td>
                      <td className={cellBaseClasses}>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="rounded-full bg-[#ACF227] px-2 py-0.5 text-[9px] text-slate-900 hover:bg-[#bdfb39]"
                            onClick={() => handleView(c.id)}
                          >
                            {isSelected ? "Ocultar" : "Ver"}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] text-white hover:bg-red-600"
                            onClick={() => handleDelete(c.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Detalle inline */}
                    {isSelected && (
                      <tr className={isDark ? "bg-slate-800" : "bg-slate-50/70"}>
                        <td colSpan={7} className="px-4 pb-3 pt-1">
                          <div
                            className={`mt-1 rounded-lg border p-3 text-[10px] shadow-xs ${
                              isDark
                                ? "border-slate-700 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h2
                                  className={`text-xs font-semibold ${
                                    isDark
                                      ? "text-slate-50"
                                      : "text-slate-900"
                                  }`}
                                >
                                  Detalle del cliente
                                </h2>
                                <p
                                  className={`mt-0.5 text-[10px] ${
                                    isDark
                                      ? "text-slate-400"
                                      : "text-slate-600"
                                  }`}
                                >
                                  Información del cliente seleccionado
                                  (sincronizado con Alegra).
                                </p>
                              </div>
                              <Button
                                className="rounded-full bg-[#ACF227] px-3 py-0.5 text-[10px] font-semibold text-slate-900 hover:bg-[#bdfb39]"
                                onClick={() => setEditing(true)}
                              >
                                Editar
                              </Button>
                            </div>

                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Nombre completo
                                </h4>
                                <p className="mt-0.5 text-xs font-medium">
                                  {c.nombre} {c.apellido}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Cédula
                                </h4>
                                <p className="mt-0.5 text-xs">
                                  {c.cedula || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Correo
                                </h4>
                                <p className="mt-0.5 text-xs">
                                  {c.correo || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Teléfono
                                </h4>
                                <p className="mt-0.5 text-xs">
                                  {c.telefono || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Departamento
                                </h4>
                                <p className="mt-0.5 text-xs">
                                  {c.departamento || "-"}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Municipio
                                </h4>
                                <p className="mt-0.5 text-xs">
                                  {c.municipio || "-"}
                                </p>
                              </div>

                              <div className="md:col-span-2">
                                <h4 className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                                  Dirección
                                </h4>
                                <p className="mt-0.5 text-xs">
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

              {!loading && visibleClients.length === 0 && (
                <tr className={rowBaseClasses}>
                  <td
                    colSpan={7}
                    className={`${cellBaseClasses} text-center text-[10px] ${
                      isDark ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    No se encontraron clientes con el criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

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
