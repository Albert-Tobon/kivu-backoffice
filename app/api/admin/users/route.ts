// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Solo ADMIN puede ver usuarios
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const role = (session.user.role as string) ?? "OPERATOR";
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, users });
}

// Actualizar rol / estado de un usuario (solo ADMIN)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const currentRole = (session.user.role as string) ?? "OPERATOR";
  if (currentRole !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    id?: string;
    role?: string;
    isActive?: boolean;
  } | null;

  if (!body?.id) {
    return NextResponse.json(
      { error: "Falta el id de usuario" },
      { status: 400 }
    );
  }

  const { id, role, isActive } = body;

  // No permitir que el admin se desactive o cambie su propio rol
  const sessionUserId = session.user.id as string | undefined;

  if (sessionUserId && sessionUserId === id) {
    if (role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol a no ADMIN" },
        { status: 400 }
      );
    }

    if (typeof isActive === "boolean" && !isActive) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propio usuario" },
        { status: 400 }
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      role: role ?? undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: updatedUser });
}
