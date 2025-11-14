// app/api/alegra/contacts/route.ts
import { NextResponse } from "next/server";
import type { Client } from "@/components/clientes/types";

export const runtime = "nodejs"; // importante para usar Buffer en el servidor

type AlegraContact = {
  id: number | string;
  name?: string;
  identification?: string;
  email?: string;
  phonePrimary?: string | { phone?: string };
  address?: {
    address?: string;
    city?: string;
    department?: string;
  };
  creationDate?: string;
};

// Construye headers de autenticación para Alegra
function getAuth() {
  const apiUser = process.env.ALEGRA_USER;
  const apiToken = process.env.ALEGRA_TOKEN;
  const apiBase =
    process.env.ALEGRA_API_BASE ?? "https://api.alegra.com/api/v1";

  if (!apiUser || !apiToken) {
    throw new Error("Faltan credenciales de Alegra (ALEGRA_USER/ALEGRA_TOKEN)");
  }

  const auth = Buffer.from(`${apiUser}:${apiToken}`).toString("base64");

  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  return { apiBase, headers };
}

export async function GET() {
  try {
    const { apiBase, headers } = getAuth();

    const limit = 30; // máximo permitido por la API
    let start = 0;
    let allContacts: AlegraContact[] = [];

    // Paginamos hasta que ya no vengan más contactos
    while (true) {
      const url = new URL(`${apiBase}/contacts`);
      url.searchParams.set("type", "client");
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("start", String(start));

      const resp = await fetch(url.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (!resp.ok) {
        const errorBody = await resp.text();
        console.error(
          "Error listando contactos de Alegra:",
          resp.status,
          errorBody
        );
        return NextResponse.json(
          { ok: false, error: "Error obteniendo contactos desde Alegra" },
          { status: 500 }
        );
      }

      const pageData = (await resp.json()) as AlegraContact[];

      allContacts = allContacts.concat(pageData);

      // Si vienen menos que el límite, ya no hay más páginas
      if (pageData.length < limit) break;

      start += limit;

      // Protección por si acaso (para que no se vuelva infinito)
      if (start > 500) break;
    }

    const clients: Client[] = allContacts.map((c) => {
      const phone =
        typeof c.phonePrimary === "string"
          ? c.phonePrimary
          : c.phonePrimary?.phone ?? "";

      return {
        // Estos campos luego se normalizan en el dashboard
        id: String(c.id),
        name: c.name ?? "",
        document: c.identification ?? "",
        email: c.email ?? "",
        phone: phone ?? "",
        department: c.address?.department ?? "",
        city: c.address?.city ?? "",
        address: c.address?.address ?? "",
        createdAt: c.creationDate ?? new Date().toISOString(),
      } as any;
    });

    // Ordenamos ya aquí, de más nuevo a más viejo
    clients.sort((a, b) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });

    return NextResponse.json({ ok: true, clients }, { status: 200 });
  } catch (err) {
    console.error("Error en GET /api/alegra/contacts:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al listar contactos de Alegra" },
      { status: 500 }
    );
  }
}
