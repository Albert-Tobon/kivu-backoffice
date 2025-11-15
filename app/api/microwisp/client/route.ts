import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 👀 Debug de variables de entorno
  console.log("ENV CHECK MIKROWISP:", {
    url: process.env.MIKROWISP_NEW_CLIENT_URL,
    token: process.env.MIKROWISP_API_TOKEN ? "OK" : "MISSING",
  });

  try {
    const body = await req.json();
    const client = body?.client;

    if (!client) {
      return NextResponse.json(
        { error: "Falta 'client' en el cuerpo de la petición" },
        { status: 400 }
      );
    }

    const newClientUrl = process.env.MIKROWISP_NEW_CLIENT_URL;
    const apiToken = process.env.MIKROWISP_API_TOKEN;

    if (!newClientUrl || !apiToken) {
      console.error("Faltan variables de entorno Mikrowisp");
      return NextResponse.json(
        { error: "Configuración Mikrowisp incompleta en el servidor" },
        { status: 500 }
      );
    }

    // Mapear tu cliente al formato que pide la API de Mikrowisp
    const payload = {
      token: apiToken,
      nombre: `${client.nombre} ${client.apellido}`.trim(),
      cedula: client.cedula,
      correo: client.correo,
      telefono: "", // si no manejas fijo puedes dejar vacío
      movil: client.telefono,
      direccion_principal: client.direccion,
    };

    console.log("Enviando a Mikrowisp:", { url: newClientUrl, payload });

    const resp = await fetch(newClientUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // si no es JSON no pasa nada, guardamos raw
    }

    console.log("Respuesta Mikrowisp:", resp.status, json ?? text);

    if (!resp.ok) {
      console.error("Error Mikrowisp:", resp.status, text);
      return NextResponse.json(
        {
          error: "Error al crear el cliente en Mikrowisp",
          status: resp.status,
          raw: json ?? text,
        },
        { status: resp.status }
      );
    }

    // Si la API devuelve algún ID del usuario, intenta leerlo aquí
    const microwispId =
      json?.id ?? json?.idcliente ?? json?.cliente_id ?? json?.data?.id;

    return NextResponse.json(
      {
        microwispId,
        raw: json ?? text,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en handler Mikrowisp:", error);
    return NextResponse.json(
      { error: "Error interno en la integración Mikrowisp" },
      { status: 500 }
    );
  }
}
