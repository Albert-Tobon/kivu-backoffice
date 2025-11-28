import { NextRequest, NextResponse } from "next/server";

const ALEGRA_USER = process.env.ALEGRA_USER;
const ALEGRA_TOKEN = process.env.ALEGRA_TOKEN;
const ALEGRA_BASE_URL = "https://api.alegra.com/api/v1";

if (!ALEGRA_USER || !ALEGRA_TOKEN) {
  console.warn(
    "[/api/alegra/check] Variables de entorno de Alegra no configuradas"
  );
}

// POST /api/alegra/contacts/check
// Body: { cedula?: string, correo?: string }
export async function POST(req: NextRequest) {
  try {
    const { cedula, correo } = await req.json();

    const cedulaTrim = (cedula || "").trim();
    const correoTrim = (correo || "").trim();

    if (!cedulaTrim && !correoTrim) {
      return NextResponse.json(
        { error: "Debes enviar al menos cédula o correo" },
        { status: 400 }
      );
    }

    if (!ALEGRA_USER || !ALEGRA_TOKEN) {
      return NextResponse.json(
        { error: "Alegra no está configurado en el servidor" },
        { status: 500 }
      );
    }

    // 1) Construimos URL con query (usamos lo que tengamos: cédula o correo)
    const searchValue = cedulaTrim || correoTrim;
    const url = new URL(`${ALEGRA_BASE_URL}/contacts`);
    url.searchParams.set("metadata", "true");
    url.searchParams.set("query", searchValue);

    const authHeader =
      "Basic " +
      Buffer.from(`${ALEGRA_USER}:${ALEGRA_TOKEN}`).toString("base64");

    const alegraRes = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!alegraRes.ok) {
      const text = await alegraRes.text();
      console.error(
        "[/api/alegra/check] Error desde Alegra.",
        "status=",
        alegraRes.status,
        "body=",
        text
      );
      return NextResponse.json(
        { error: "Error interno consultando Alegra" },
        { status: 500 }
      );
    }

    const json = await alegraRes.json();

    // Alegra puede devolver { data: [...], metadata: {...} } o solo [...]
    const lista = Array.isArray(json) ? json : json?.data;

    let match: any = null;
    let existsByCedula = false;
    let existsByCorreo = false;

    if (Array.isArray(lista)) {
      for (const c of lista) {
        const cedulaMatch =
          !!cedulaTrim &&
          (c.identification === cedulaTrim ||
            c.identificationObject?.number === cedulaTrim);

        const correoMatch =
          !!correoTrim &&
          typeof c.email === "string" &&
          c.email.toLowerCase() === correoTrim.toLowerCase();

        if (cedulaMatch || correoMatch) {
          match = c;
          if (cedulaMatch) existsByCedula = true;
          if (correoMatch) existsByCorreo = true;
          // No rompemos el loop para acumular flags,
          // pero el "match" nos sirve para log y retorno.
        }
      }
    }

    if (match) {
      console.log("[/api/alegra/check] Contacto encontrado =>", {
        id: match.id,
        name: match.name,
        identification: match.identification,
        email: match.email,
        matchByCedula: existsByCedula,
        matchByCorreo: existsByCorreo,
      });
    } else {
      console.log(
        "[/api/alegra/check] Sin coincidencias para:",
        cedulaTrim || correoTrim
      );
    }

    return NextResponse.json({
      exists: !!match,
      existsByCedula,
      existsByCorreo,
      contact: match ?? null,
    });
  } catch (error) {
    console.error("[/api/alegra/check] Error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado validando en Alegra" },
      { status: 500 }
    );
  }
}
