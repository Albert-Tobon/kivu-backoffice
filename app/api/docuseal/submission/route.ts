// app/api/docuseal/submission/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { client } = await req.json();

    const apiKey = process.env.DOCUSEAL_API_KEY;
    const templateId = process.env.DOCUSEAL_TEMPLATE_ID_CONTRATO;
    const apiBase = process.env.DOCUSEAL_API_BASE || "https://docu.kivu.com.co/api";

    // correo kivu del usuario logueado (O de .env.local)
    const kivuEmail = process.env.KIVU_DEFAULT_EMAIL;

    if (!apiKey || !templateId) {
      console.error(
        "Faltan DOCUSEAL_API_KEY o DOCUSEAL_TEMPLATE_ID_CONTRATO en .env.local"
      );
      return NextResponse.json(
        { error: "DocuSeal no está configurado en el servidor" },
        { status: 500 }
      );
    }

    if (!kivuEmail) {
      console.error("Falta KIVU_DEFAULT_EMAIL en .env.local");
      return NextResponse.json(
        { error: "Correo de KIVU no definido" },
        { status: 500 }
      );
    }

    const fullName = `${client.nombre ?? ""} ${client.apellido ?? ""}`.trim();

    const resp = await fetch(`${apiBase}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": apiKey,
      },
      body: JSON.stringify({
        template_id: Number(templateId),
        send_email: true,

        submitters: [
          // 👤 1. Cliente
          {
            name: fullName || client.nombre,
            email: client.correo,
            external_id: client.id,
            metadata: {
              departamento: client.departamento,
              municipio: client.municipio,
              direccion: client.direccion,
              telefono: client.telefono,
              cedula: client.cedula,
            },
          },

          // 🧑‍💼 2. Usuario KIVU logueado o definido en el .env
          {
            name: "KIVU",
            email: kivuEmail,
            external_id: "kivu-user",
            metadata: {
              rol: "KIVU - creador",
            },
          },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Error DocuSeal:", resp.status, txt);
      return NextResponse.json(
        { error: "Error creando submission en DocuSeal" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ ok: true, submission: data });

  } catch (err) {
    console.error("Error en API /docuseal/submission:", err);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}
