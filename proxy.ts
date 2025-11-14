// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Esta función se ejecuta ANTES de tus rutas (como antes el middleware)
export default function proxy(req: NextRequest) {
  const session = req.cookies.get("kivu_session")?.value;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname.startsWith("/login");
  const isApiLogin = pathname.startsWith("/api/login");
  const isApiLogout = pathname.startsWith("/api/logout");

  // Dejar pasar login y logout sin sesión
  if (isLoginPage || isApiLogin || isApiLogout) {
    return NextResponse.next();
  }

  // Rutas que queremos proteger con login
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/api/alegra") ||
    pathname.startsWith("/api/docuseal");

  // Si necesita auth y NO hay cookie de sesión -> redirigir a /login
  if (needsAuth && !session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // En cualquier otro caso, dejamos seguir la request normal
  return NextResponse.next();
}

// A qué rutas se aplica este proxy
export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/clientes/:path*",
    "/api/:path*",
  ],
};
