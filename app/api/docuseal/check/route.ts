// app/api/docuseal/check/route.ts
import { NextRequest, NextResponse } from "next/server";

const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_BASE;
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

if (!DOCUSEAL_API_URL || !DOCUSEAL_API_KEY) {
  console.warn(
    "[/api/docuseal/check] Variables de entorno de DocuSeal no configuradas"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Debes enviar el correo a validar" },
        { status: 400 }
      );
    }

    if (!DOCUSEAL_API_URL || !DOCUSEAL_API_KEY) {
      return NextResponse.json(
        { error: "DocuSeal no está configurado en el servidor" },
        { status: 500 }
      );
    }

    const base = DOCUSEAL_API_URL.replace(/\/$/, "");
    const url = `${base}/submissions?q=${encodeURIComponent(
      email
    )}&limit=1`; // 1 sola consulta

    console.log("[/api/docuseal/check] Fetch URL:", url);

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": DOCUSEAL_API_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(
        "[/api/docuseal/check] Error desde DocuSeal. status=",
        resp.status,
        "body=",
        text
      );

      if (resp.status === 401 || resp.status === 403) {
        return NextResponse.json(
          { error: "No autorizado al consultar DocuSeal" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Error interno consultando DocuSeal" },
        { status: 500 }
      );
    }

    const data: any = await resp.json();

    // Intentamos localizar el array de resultados en distintas propiedades
    const candidates = [
      data?.submissions,
      data?.items,
      data?.results,
      data?.data,
    ];

    let submissions: any[] = [];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        submissions = c;
        break;
      }
    }

    if (Array.isArray(data) && submissions.length === 0) {
      submissions = data;
    }

    // Buscamos un total explícito, si existe
    let total = submissions.length;

    if (typeof data?.total === "number") {
      total = data.total;
    } else if (typeof data?.count === "number") {
      total = data.count;
    } else if (typeof data?.meta?.total === "number") {
      total = data.meta.total;
    }

    const exists = total > 0 || submissions.length > 0;

    console.log(
      `[/api/docuseal/check] total=${total}, submissionsLength=${submissions.length} para ${email}`
    );

    return NextResponse.json({
      exists,
      count: total,
    });
  } catch (error) {
    console.error("[/api/docuseal/check] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno consultando DocuSeal" },
      { status: 500 }
    );
  }
}
