// app/api/integrations/status/route.ts
import { NextResponse } from "next/server";

/* ---------- Health check Alegra ---------- */
async function checkAlegra() {
  try {
    const username = process.env.ALEGRA_USER;
    const token = process.env.ALEGRA_TOKEN;

    if (!username || !token) {
      return { status: "error" as const, message: "Credenciales faltantes" };
    }

    const authString = Buffer.from(`${username}:${token}`).toString("base64");

    const resp = await fetch("https://api.alegra.com/api/v1/contacts?limit=1", {
      headers: { Authorization: `Basic ${authString}` },
      cache: "no-store",
    });

    if (!resp.ok) {
      return { status: "error" as const, message: `HTTP ${resp.status}` };
    }

    return { status: "ok" as const };
  } catch (e) {
    return { status: "error" as const, message: String(e) };
  }
}

/* ---------- Health check DocuSeal ---------- */
async function checkDocuSeal() {
  try {
    const apiKey = process.env.DOCUSEAL_API_KEY;
    const rawBase =
      process.env.DOCUSEAL_API_BASE ?? "https://api.docuseal.com";

    if (!apiKey) {
      return {
        status: "error" as const,
        message: "Config DocuSeal incompleta (faltan credenciales)",
      };
    }

    // Usamos EXACTAMENTE la misma base que te funciona en Postman
    const base = rawBase.replace(/\/$/, ""); // quita solo el / final si lo hay

    // Esto debe ser igual a lo que probaste en Postman:
    // GET https://docu.kivu.com.co/api/submissions?limit=1
    const url = `${base}/submissions?limit=1`;
    console.log("[DocuSeal healthcheck] URL:", url);

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-Auth-Token": apiKey,
      },
      cache: "no-store",
    });

    console.log("[DocuSeal healthcheck] status:", resp.status);

    if (resp.status === 401 || resp.status === 403) {
      return {
        status: "error" as const,
        message: `Credenciales DocuSeal inválidas (HTTP ${resp.status})`,
      };
    }

    if (!resp.ok) {
      return {
        status: "error" as const,
        message: `HTTP ${resp.status}`,
      };
    }

    // Si llega aquí, DocuSeal está funcionando OK
    return { status: "ok" as const };
  } catch (e) {
    console.error("[DocuSeal healthcheck] Error:", e);
    return { status: "error" as const, message: String(e) };
  }
}

/* ---------- Health check Mikrowisp ---------- */
async function checkMikrowisp() {
  try {
    const url = process.env.MIKROWISP_NEW_USER_URL;
    const token = process.env.MIKROWISP_API_TOKEN;

    if (!url || !token) {
      return {
        status: "error" as const,
        message: "Config Mikrowisp incompleta",
      };
    }

    // Llamado mínimo: solo token. Si el servicio está vivo responderá 200
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });

    const text = await resp.text();

    if (!resp.ok) {
      return {
        status: "error" as const,
        message: `HTTP ${resp.status}`,
      };
    }

    if (text.includes("URL api es incorrecto")) {
      return {
        status: "error" as const,
        message: "URL Mikrowisp incorrecta",
      };
    }

    return { status: "ok" as const };
  } catch (e) {
    return { status: "error" as const, message: String(e) };
  }
}

/* ---------- Handler ---------- */
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
