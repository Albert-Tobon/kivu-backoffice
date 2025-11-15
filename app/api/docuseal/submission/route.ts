// app/api/docuseal/submission/route.ts
import { NextResponse } from "next/server";

interface NewClientPayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cedula?: string;
  // lo que tú estés enviando desde el formulario
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DOCUSEAL_API_KEY;
    const templateId = process.env.DOCUSEAL_TEMPLATE_ID;
    const rawBase =
      process.env.DOCUSEAL_API_BASE ?? "https://api.docuseal.com";

    if (!apiKey || !templateId) {
      return NextResponse.json(
        { ok: false, error: "Config DocuSeal incompleta" },
        { status: 500 }
      );
    }

    let base = rawBase.replace(/\/$/, "");
    if (!base.endsWith("/api")) {
      base = `${base}/api`;
    }

    const body = (await req.json()) as NewClientPayload;

    // Aquí mapeas tus campos a los campos del template:
    const fullName = `${body.nombre} ${body.apellido}`.trim();

    const resp = await fetch(`${base}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": apiKey,
      },
      body: JSON.stringify({
        template_id: Number(templateId),
        submitters: [
          {
            // "role" debe existir en tu plantilla DocuSeal
            role: "Titular", // o el nombre que uses en la plantilla
            email: body.email,
            name: fullName,
            // Opcional: pre-rellenar campos
            fields: [
              { name: "Nombre", default_value: fullName },
              { name: "Correo", default_value: body.email },
              { name: "Teléfono", default_value: body.telefono ?? "" },
              { name: "Cédula", default_value: body.cedula ?? "" },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Error DocuSeal:", resp.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: `DocuSeal HTTP ${resp.status}`,
          details: text,
        },
        { status: 500 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({ ok: true, submission: data });
  } catch (e) {
    console.error("Error creando submission DocuSeal:", e);
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
