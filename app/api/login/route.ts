// app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const validEmail = process.env.APP_LOGIN_EMAIL;
  const validPassword = process.env.APP_LOGIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json(
      { error: "Login no configurado en el servidor" },
      { status: 500 }
    );
  }

  const ok = email === validEmail && password === validPassword;

  if (!ok) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  // Si está ok, creamos cookie de sesión
  const res = NextResponse.json({ ok: true });

  res.cookies.set("kivu_session", "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return res;
}
