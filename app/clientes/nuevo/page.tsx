// app/clientes/nuevo/page.tsx
import type { Metadata } from "next";
import NewClientForm from "../../../components/clientes/NewClientForm";

export const metadata: Metadata = {
  title: "Nuevo cliente | KIVU Backoffice",
};

export default function NewClientPage() {
  return <NewClientForm />;
}
