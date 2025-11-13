// app/dashboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | KIVU Backoffice",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bienvenido al Backoffice de KIVU
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Aquí construiremos el módulo de clientes y las integraciones con
          DocuSeal, MikroWISP y Alegra.
        </p>
      </div>
    </main>
  );
}
