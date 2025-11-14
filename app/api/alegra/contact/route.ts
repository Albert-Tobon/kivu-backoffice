// app/api/alegra/contact/route.ts
import { NextResponse } from "next/server";

interface ClientPayload {
  id: string;
  nombre: string;       // "Yuli Angelica"
  apellido: string;     // "Espinel Lara"
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
}

// Helper: separa "ALBERT BRAYAN" en firstName / secondName, todo en MAYÚSCULA
function splitName(full: string) {
  const upper = (full ?? "").toUpperCase().trim();
  const parts = upper.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const secondName = parts.slice(1).join(" "); // por si hay 2+ nombres
  return { firstName, secondName };
}

export async function POST(req: Request) {
  try {
    const { client } = (await req.json()) as { client: ClientPayload };

    if (!client) {
      return NextResponse.json(
        { error: "No se recibió objeto client" },
        { status: 400 }
      );
    }

    const apiUser = process.env.ALEGRA_USER;
    const apiToken = process.env.ALEGRA_TOKEN;

    if (!apiUser || !apiToken) {
      return NextResponse.json(
        { error: "Config Alegra incompleta (.env)" },
        { status: 500 }
      );
    }

    const url = "https://api.alegra.com/api/v1/contacts";

    // Nombre MAYÚSCULA para Alegra
    const fullName = `${client.nombre} ${client.apellido}`
      .trim()
      .toUpperCase();

    // Desglose de nombres y apellidos para nameObject (en mayúsculas)
    const { firstName, secondName } = splitName(client.nombre);
    const {
      firstName: lastName,
      secondName: secondLastName,
    } = splitName(client.apellido);

    const auth = Buffer.from(`${apiUser}:${apiToken}`).toString("base64");

    const payload = {
      name: fullName,
      type: "client",
      status: "active",
      kindOfPerson: "PERSON_ENTITY", // Persona natural

      identification: client.cedula,
      identificationObject: {
        type: "CC", // Cédula de ciudadanía
        number: client.cedula,
      },

      nameObject: {
        firstName,      // "YULI"
        secondName,     // "ANGELICA"
        lastName,       // "ESPINEL"
        secondLastName, // "LARA"
      },

      email: client.correo || undefined,
      phonePrimary: client.telefono || undefined,

      address: {
        description: client.direccion || "",
        city: client.municipio || "",
        department: client.departamento || "",
      },

      observations: `Creado desde KIVU Backoffice (id interno: ${client.id})`,
    };

    console.log("URL usada Alegra:", url);
    console.log("Payload enviado a Alegra:", payload);

    const alegraResp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
        alegraId: (data as any).id ?? null,
        alegra: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error interno Alegra:", err);
    return NextResponse.json(
      { error: "Error interno en servidor Alegra" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { alegraId } = (await req.json()) as { alegraId?: number };

    if (!alegraId) {
      return NextResponse.json(
        { error: "alegraId es obligatorio para borrar" },
        { status: 400 }
      );
    }

    const apiUser = process.env.ALEGRA_USER;
    const apiToken = process.env.ALEGRA_TOKEN;

    if (!apiUser || !apiToken) {
      return NextResponse.json(
        { error: "Config Alegra incompleta (.env)" },
        { status: 500 }
      );
    }

    const url = `https://api.alegra.com/api/v1/contacts/${alegraId}`;
    const auth = Buffer.from(`${apiUser}:${apiToken}`).toString("base64");

    console.log("Eliminando contacto Alegra ID:", alegraId, "URL:", url);

    const resp = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
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