// app/api/microwisp/client/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = body?.client;

    // Validación mínima
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "Falta 'client' en el cuerpo de la petición" },
        { status: 400 }
      );
    }

    const url = process.env.MIKROWISP_NEW_USER_URL;
    const token = process.env.MIKROWISP_API_TOKEN;

    // Si no hay config, respondemos 500 y listo
    if (!url || !token) {
      return NextResponse.json(
        { ok: false, error: "Configuración Mikrowisp incompleta en el servidor" },
        { status: 500 }
      );
    }

    // Payload EXACTO como la documentación de NewUser
    const payload = {
      token,
      nombre: `${client.nombre ?? ""} ${client.apellido ?? ""}`.trim() || client.nombre,
      cedula: client.cedula,
      correo: client.correo,
      telefono: client.telefonoFijo ?? "", // si no manejas fijo, puedes dejar ""
      movil: client.telefono,
      direccion_principal: client.direccion,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // si no es JSON, dejamos data en null
    }

    // Si Mikrowisp responde con HTTP de error, lo pasamos tal cual
    if (!resp.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: resp.status,
          raw: data ?? text,
        },
        { status: resp.status }
      );
    }

    // Intentamos leer el idcliente (si viene)
    const microwispId = data?.idcliente ?? null;

    return NextResponse.json(
      {
        ok: true,
        microwispId,
        raw: data ?? text,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en handler Mikrowisp:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno en la integración Mikrowisp" },
      { status: 500 }
    );
  }
}
