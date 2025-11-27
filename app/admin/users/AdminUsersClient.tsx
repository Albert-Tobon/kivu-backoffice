// app/admin/users/AdminUsersClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";

type Role = "ADMIN" | "OPERATOR";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  currentUserEmail: string;
  currentUserId: string;
};

export default function AdminUsersClient({
  currentUserEmail,
  currentUserId,
}: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/admin/users");
        const json = await res.json();

        if (!res.ok || !json.ok) {
          console.error("Error cargando usuarios:", json);
          setError(json.error || "Error al cargar usuarios");
          return;
        }

        setUsers(json.users as UserRow[]);
      } catch (err) {
        console.error("Error llamando a /api/admin/users:", err);
        setError("Error al cargar usuarios");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const isSelf = (u: UserRow) => u.id === currentUserId;

  const updateUser = async (id: string, data: Partial<UserRow>) => {
    try {
      setSavingId(id);
      setError(null);

      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: data.role, isActive: data.isActive }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        console.error("Error actualizando usuario:", json);
        setError(json.error || "Error al actualizar usuario");
        return;
      }

      const updated = json.user as UserRow;
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      console.error("Error llamando a PUT /api/admin/users:", err);
      setError("Error al actualizar usuario");
    } finally {
      setSavingId(null);
    }
  };

  const handleChangeRole = (u: UserRow, newRole: Role) => {
    if (isSelf(u) && newRole !== "ADMIN") {
      alert("No puedes cambiar tu propio rol a no ADMIN.");
      return;
    }
    if (u.role === newRole) return;
    updateUser(u.id, { role: newRole });
  };

  const handleToggleActive = (u: UserRow) => {
    if (isSelf(u) && u.isActive) {
      alert("No puedes desactivar tu propio usuario.");
      return;
    }
    updateUser(u.id, { isActive: !u.isActive });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {/* Header */}
        <section className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Administración de usuarios
            </h1>
            <p className="text-xs text-slate-500">
              Gestiona los usuarios del Backoffice KIVU, sus roles y estado
              activo.
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Estás logueado como{" "}
              <span className="font-semibold">{currentUserEmail}</span> (ADMIN).
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Link href="/dashboard">
              <Button className="rounded-full px-4 py-1 text-xs">
                Volver al dashboard
              </Button>
            </Link>
          </div>
        </section>

        {/* Mensaje de error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        <section className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Rol
                </th>
                <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Activo
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Creado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-3 text-center text-[11px] text-slate-500"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-3 text-center text-[11px] text-slate-500"
                  >
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}

              {users.map((u) => {
                const self = isSelf(u);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 align-middle text-[11px] text-slate-900">
                      {u.name || "-"}
                      {self && (
                        <span className="ml-1 rounded-full bg-slate-100 px-2 py-[1px] text-[10px] text-slate-600">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-[11px] text-slate-700">
                      {u.email}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <select
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-300"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) =>
                          handleChangeRole(u, e.target.value as Role)
                        }
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="OPERATOR">OPERATOR</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <button
                        type="button"
                        disabled={savingId === u.id}
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold transition ${
                          u.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {u.isActive ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle text-[11px] text-slate-500">
                      {new Date(u.createdAt).toLocaleString("es-CO")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
