// app/api/alegra/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Client } from "@/components/clientes/types";

export const runtime = "nodejs"; // necesario para usar Buffer en el servidor

// --------- TIPOS ---------
interface ClientPayload {
  id: string;
  nombre: string; // "Yuli Angelica"
  apellido: string; // "Espinel Lara"
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
}

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

// --------- HELPERS ---------

// Separa "ALBERT BRAYAN" en firstName / secondName, todo en MAYÚSCULA
function splitName(full: string) {
  const upper = (full ?? "").toUpperCase().trim();
  const parts = upper.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const secondName = parts.slice(1).join(" "); // por si hay 2+ nombres
  return { firstName, secondName };
}

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

// --------- GET: LISTAR CONTACTOS ---------
export async function GET() {
  try {
    const { apiBase, headers } = getAuth();

    const limit = 30; // máximo permitido por la API
    let start = 0;
    let allContacts: AlegraContact[] = [];

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

      if (pageData.length < limit) break; // última página
      start += limit;

      if (start > 500) break; // protección
    }

    const clients: Client[] = allContacts.map((c) => {
      const phone =
        typeof c.phonePrimary === "string"
          ? c.phonePrimary
          : c.phonePrimary?.phone ?? "";

      return {
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

    // Ordenamos de más nuevo a más viejo
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

// --------- POST: CREAR CONTACTO ---------
export async function POST(req: NextRequest) {
  try {
    const { client } = (await req.json()) as { client: ClientPayload };

    if (!client) {
      return NextResponse.json(
        { error: "No se recibió objeto client" },
        { status: 400 }
      );
    }

    const { apiBase, headers } = getAuth();
    const url = `${apiBase}/contacts`;

    // Nombre MAYÚSCULA para Alegra
    const fullName = `${client.nombre} ${client.apellido}`
      .trim()
      .toUpperCase();

    // Desglose de nombres y apellidos en mayúsculas
    const { firstName, secondName } = splitName(client.nombre);
    const {
      firstName: lastName,
      secondName: secondLastName,
    } = splitName(client.apellido);

    const payload = {
      name: fullName,
      type: "client",
      status: "active",
      kindOfPerson: "PERSON_ENTITY", // Persona natural
      // regimen / fiscalResidence si los necesitas se pueden agregar luego

      identification: client.cedula,
      identificationObject: {
        type: "CC",
        number: client.cedula,
      },

      nameObject: {
        firstName, // "YULI"
        secondName, // "ANGELICA"
        lastName, // "ESPINEL"
        secondLastName, // "LARA"
      },

      email: client.correo || undefined,
      phonePrimary: client.telefono || undefined,

      address: {
        // alineado con el body que tienes en Postman:
        address: client.direccion || "",
        city: client.municipio || "",
        department: client.departamento || "",
      },

      observations: `Creado desde KIVU Backoffice (id interno: ${client.id})`,
    };

    console.log("URL usada Alegra:", url);
    console.log("Payload enviado a Alegra:", payload);

    const alegraResp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await alegraResp.json().catch(() => null);

    if (!alegraResp.ok) {
      console.error("Error Alegra:", alegraResp.status, data);
      return NextResponse.json(
        {
          error: "Error creando contacto en Alegra",
          status: alegraResp.status,
          detail: data,
        },
        { status: alegraResp.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        alegraId: (data as any)?.id ?? null,
        alegra: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error interno Alegra (POST):", err);
    return NextResponse.json(
      { error: "Error interno en servidor Alegra" },
      { status: 500 }
    );
  }
}

// --------- DELETE: ELIMINAR CONTACTO ---------
export async function DELETE(req: NextRequest) {
  try {
    const { alegraId } = (await req.json()) as { alegraId?: number | string };

    if (!alegraId) {
      return NextResponse.json(
        { error: "alegraId es obligatorio para borrar" },
        { status: 400 }
      );
    }

    const { apiBase, headers } = getAuth();
    const url = `${apiBase}/contacts/${alegraId}`;

    console.log("Eliminando contacto Alegra ID:", alegraId, "URL:", url);

    const resp = await fetch(url, {
      method: "DELETE",
      headers,
    });

    const data = await resp.text().catch(() => "");

    if (!resp.ok) {
      console.error("Error eliminando contacto en Alegra:", resp.status, data);
      return NextResponse.json(
        {
          error: "No se pudo eliminar en Alegra",
          status: resp.status,
          detail: data,
        },
        { status: resp.status }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Error interno DELETE Alegra:", err);
    return NextResponse.json(
      { error: "Error interno en servidor Alegra" },
      { status: 500 }
    );
  }
}
