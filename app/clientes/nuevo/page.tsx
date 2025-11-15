// app/clientes/nuevo/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NewClientForm from "../../../components/clientes/NewClientForm";
import StatusBadges from "@/components/clientes/integrations/StatusBadges";

export const metadata: Metadata = {
  title: "Nuevo cliente | KIVU Backoffice",
};

export default function NewClientPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Breadcrumbs */}
        <div className="text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-700">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="cursor-default text-slate-600">Clientes</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-800">Nuevo cliente</span>
        </div>

        {/* Header superior */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Registrar nuevo cliente
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Este registro creará el cliente en KIVU Backoffice e intentará
              sincronizarlo con DocuSeal, Alegra y Mikrowisp.
            </p>
          </div>

          {/* Estado de integraciones (dinámico en el cliente) */}
          <StatusBadges />
        </header>

        {/* Card con el formulario */}
        <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
          <NewClientForm />
        </section>
      </div>
    </main>
  );
}
