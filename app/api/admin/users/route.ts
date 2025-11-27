// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

// GET /api/admin/users
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

// PUT /api/admin/users
// Body: { id: string; role?: "ADMIN" | "OPERATOR"; isActive?: boolean }
export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body?.id) {
    return NextResponse.json(
      { error: "Falta el id de usuario" },
      { status: 400 }
    );
  }

  const { id, role, isActive } = body as {
    id: string;
    role?: "ADMIN" | "OPERATOR";
    isActive?: boolean;
  };

  // No permitir que el admin se desactive o cambie su propio rol
  if (session.user.id === id) {
    if (role && role !== "ADMIN") {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol a no ADMIN" },
        { status: 400 }
      );
    }
    if (typeof isActive === "boolean" && isActive === false) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propio usuario" },
        { status: 400 }
      );
    }
  }

  const data: any = {};
  if (role) data.role = role;
  if (typeof isActive === "boolean") data.isActive = isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No hay cambios para aplicar" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: { ...updated, createdAt: updated.createdAt.toISOString() },
  });
}
