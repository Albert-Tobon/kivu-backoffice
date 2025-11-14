import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = body?.client;

    if (!client) {
      return NextResponse.json(
        { error: "Falta 'client' en el cuerpo de la petición" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.MIKROWISP_BASE_URL;
    const newClientUrl = process.env.MIKROWISP_NEW_CLIENT_URL;
    const apiToken = process.env.MIKROWISP_API_TOKEN;

    if (!baseUrl || !newClientUrl || !apiToken) {
      console.error("Faltan variables de entorno Mikrowisp");
      return NextResponse.json(
        { error: "Configuración Mikrowisp incompleta en el servidor" },
        { status: 500 }
      );
    }

    // 🔵 1) Mapear tu objeto Client -> payload que espera Mikrowisp
    // Revisa en tu documentación qué nombres exactos de campos usa la API
    // (ej. idcliente, nombre, numero_documento, telefono_movil, email, etc.)

    const payload: any = {
      // ⚠️ TODO: AJUSTAR LOS NOMBRES DE CAMPOS SEGÚN LA DOC DE API
      // Ejemplos típicos (son EJEMPLOS, cambia los nombres exactos):
      // "idcliente": "",              // si lo dejas vacío lo genera automático
      // "password_portal": client.cedula,
      // "numero_identificacion": client.cedula,
      // "nombre_completo": client.nombre + " " + client.apellido,
      // "tipo_estrato": 1,
      // "direccion_principal": client.direccion,
      // "ubicacion": client.municipio,
      // "telefono_fijo": "",
      // "telefono_movil": client.telefono,
      // "email": client.correo,
    };

    // elimina claves undefined por si las dejas opcionales
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) {
        delete payload[k];
      }
    });

    // 🔵 2) Llamar al endpoint real de Mikrowisp
    // Revisa en la doc CÓMO se envía el token:
    //   - Puede ser Header (ej. Authorization / X-Token / TokenAPI)
    //   - Puede ser query param (ej. ?token=...)
    //
    // Abajo te dejo el ejemplo más común con Header.
    const resp = await fetch(newClientUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // ⚠️ TODO: AJUSTAR SEGÚN LA DOC:
        // Si la doc dice:
        //   Header:  TokenAPI: <token>
        //   Header:  Authorization: Bearer <token>
        //   Query:   ?token=<token>
        //
        // cambia esta línea:
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // si la respuesta no es JSON no pasa nada, igual devolvemos raw
    }

    if (!resp.ok) {
      console.error("Error Mikrowisp:", resp.status, text);
      return NextResponse.json(
        {
          error: "Error al crear el cliente en Mikrowisp",
          status: resp.status,
          raw: text,
        },
        { status: resp.status }
      );
    }

    // 🔵 3) Obtener el ID del nuevo cliente desde la respuesta
    // Mira en la doc cómo viene ese ID (ej. id, idcliente, usuario_id...)
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
