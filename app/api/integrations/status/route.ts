import { NextResponse } from "next/server";

/**
 * -------- Health Check de Alegra --------
 */
async function checkAlegra() {
  try {
    const username = process.env.ALEGRA_USER;
    const token = process.env.ALEGRA_TOKEN;

    if (!username || !token) {
      return { status: "error", message: "Credenciales faltantes" };
    }

    const authString = Buffer.from(`${username}:${token}`).toString("base64");

    const resp = await fetch("https://api.alegra.com/api/v1/contacts?limit=1", {
      headers: { Authorization: `Basic ${authString}` },
    });

    if (!resp.ok) {
      return { status: "error", message: "Alegra no responde" };
    }

    return { status: "ok" };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

/**
 * -------- Health Check de DocuSeal --------
 */
async function checkDocuSeal() {
  const apiKey = process.env.DOCUSEAL_API_KEY;
  const baseUrl = process.env.DOCUSEAL_API_BASE;
  const templateId = process.env.DOCUSEAL_TEMPLATE_ID;

  if (!apiKey || !baseUrl || !templateId) {
    return { status: "error", message: "Faltan variables de entorno DocuSeal" };
  }

  // Si en algún momento quieres hacer un check "duro", aquí podríamos
  // hacer un fetch a `${baseUrl}/templates/${templateId}`.
  return { status: "ok" };
}

/**
 * -------- Health Check Mikrowisp --------
 */
async function checkMikrowisp() {
  try {
    const url = process.env.MIKROWISP_NEW_CLIENT_URL;
    const token = process.env.MIKROWISP_API_TOKEN;

    if (!url || !token) {
      return { status: "error", message: "Config incompleta" };
    }

    // Prueba mínima: solo validar que no devuelve “URL incorrecto”
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const text = await resp.text();

    if (text.includes("incorrecto")) {
      return { status: "error", message: "La URL Mikrowisp es incorrecta" };
    }

    return { status: "ok" };
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

export async function GET() {
  const [alegra, docuseal, mikrowisp] = await Promise.all([
    checkAlegra(),
    checkDocuSeal(),
    checkMikrowisp(),
  ]);

  return NextResponse.json({
    alegra,
    docuseal,
    mikrowisp,
  });
}
