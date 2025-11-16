// app/api/docuseal/submission/route.ts
import { NextResponse } from "next/server";

const apiBase = process.env.DOCUSEAL_API_BASE ?? "https://api.docuseal.com";
const apiKey = process.env.DOCUSEAL_API_KEY;
const templateId = process.env.DOCUSEAL_TEMPLATE_ID;

if (!apiKey) {
  console.warn("DOCUSEAL_API_KEY no está definido en .env.local");
}
if (!templateId) {
  console.warn("DOCUSEAL_TEMPLATE_ID no está definido en .env.local");
}

// ---------- TIPOS ----------
type ClientPayload = {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  telefono: string;
  direccion: string;
  departamento: string;
  municipio: string;
};

type CreateBody = {
  client: ClientPayload;
  kivuEmail?: string | null;
};

// ---------- CREAR SUBMISSION ----------
export async function POST(req: Request) {
  try {
    if (!apiKey || !templateId) {
      return NextResponse.json(
        { error: "Config de DocuSeal incompleta" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CreateBody;
    const { client, kivuEmail } = body;

    if (!client || !client.correo) {
      return NextResponse.json(
        { error: "Datos de cliente inválidos" },
        { status: 400 }
      );
    }

    const fullName = `${client.nombre ?? ""} ${client.apellido ?? ""}`
      .trim()
      .replace(/\s+/g, " ");

    // Si no hay kivuEmail en el body, usamos un fallback del .env
    const fallbackKivuEmail =
      process.env.NEXT_PUBLIC_KIVU_FALLBACK_EMAIL ?? undefined;
    const kivuEmailToUse = kivuEmail || fallbackKivuEmail;

    const payload = {
      template_id: Number(templateId),
      send_email: true,
      external_id: client.id, // <- clave para luego archivarlo por clientId
      submitters: [
        // 1. Cliente
        {
          name: fullName || client.correo,
          email: client.correo,
          metadata: {
            client_id: client.id,
            telefono: client.telefono,
            direccion: client.direccion,
            departamento: client.departamento,
            municipio: client.municipio,
            cedula: client.cedula,
          },
        },
        // 2. KIVU (opcional, sólo si tenemos correo)
        ...(kivuEmailToUse
          ? [
              {
                name: "KIVU",
                email: kivuEmailToUse,
              },
            ]
          : []),
      ],
    };

    const resp = await fetch(`${apiBase}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Error al crear submission en DocuSeal:", resp.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo crear el submission en DocuSeal",
          status: resp.status,
        },
        { status: 500 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ ok: true, submission: data });
  } catch (err) {
    console.error("Error en API /docuseal/submission (POST):", err);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}

// ---------- ARCHIVAR SUBMISSION AL BORRAR CLIENTE ----------
export async function DELETE(req: Request) {
  try {
    if (!apiKey || !templateId) {
      return NextResponse.json(
        { error: "Config de DocuSeal incompleta" },
        { status: 500 }
      );
    }

    const { clientId } = (await req.json()) as { clientId?: string };

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId es obligatorio" },
        { status: 400 }
      );
    }

    // 1) Buscar submissions por external_id = clientId
    const listUrl = new URL(`${apiBase}/submissions`);
    listUrl.searchParams.set("template_id", String(templateId));
    listUrl.searchParams.set("external_id", clientId);

    const listResp = await fetch(listUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": apiKey,
      },
    });

    if (!listResp.ok) {
      const text = await listResp.text();
      console.error(
        "Error al listar submissions en DocuSeal:",
        listResp.status,
        text
      );
      return NextResponse.json(
        { error: "No se pudieron obtener submissions de DocuSeal" },
        { status: 500 }
      );
    }

    const listData: any = await listResp.json();

    // La respuesta puede venir en diferentes formatos, intentamos detectar el array:
    let submissions: any[] = [];
    if (Array.isArray(listData)) {
      submissions = listData;
    } else if (Array.isArray(listData.submissions)) {
      submissions = listData.submissions;
    } else if (Array.isArray(listData.data)) {
      submissions = listData.data;
    } else if (Array.isArray(listData.items)) {
      submissions = listData.items;
    }

    const submission = submissions[0];

    if (!submission?.id) {
      console.warn(
        "No se encontró submission en DocuSeal para clientId:",
        clientId,
        "Respuesta:",
        listData
      );
      return NextResponse.json(
        {
          ok: false,
          message: "No se encontró submission en DocuSeal para este cliente",
        },
        { status: 404 }
      );
    }

    // 2) Archivar submission
    const deleteResp = await fetch(`${apiBase}/submissions/${submission.id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-Auth-Token": apiKey,
      },
    });

    if (!deleteResp.ok) {
      const text = await deleteResp.text();
      console.error(
        "Error al archivar submission en DocuSeal:",
        deleteResp.status,
        text
      );
      return NextResponse.json(
        {
          ok: false,
          error: "No se pudo archivar el submission en DocuSeal",
          status: deleteResp.status,
        },
        { status: 500 }
      );
    }

    const archived = await deleteResp.json();
    return NextResponse.json({ ok: true, archived });
  } catch (err) {
    console.error("Error en API /docuseal/submission (DELETE):", err);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
