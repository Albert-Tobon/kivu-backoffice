// lib/auth.ts
import { PrismaClient } from "@prisma/client";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Prisma client
export const prisma = new PrismaClient();

// --- Tipado extra para que Session/JWT incluyan id y role ---
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// Config de dominio y admin
const ADMIN_EMAIL =
  process.env.APP_LOGIN_EMAIL?.toLowerCase() ?? "albert.tobon@kivu.com.co";
const ALLOWED_DOMAIN = "kivu.com.co";

export const authOptions: NextAuthOptions = {
  // IMPORTANTE: ya NO usamos PrismaAdapter
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * 1) Validar dominio y asegurar usuario en Prisma
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase() ?? "";

      // Solo correos @kivu.com.co
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.warn("Intento de login con dominio no permitido:", email);
        return false;
      }

      const role = email === ADMIN_EMAIL ? "ADMIN" : "OPERATOR";

      // Creamos / actualizamos el usuario en nuestra tabla User
      await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? "",
          role,
          isActive: true,
        },
        create: {
          email,
          name: user.name ?? "",
          role,
          isActive: true,
        },
      });

      return true;
    },

    /**
     * 2) Meter id y role en el JWT
     */
    async jwt({ token }) {
      const email = token.email?.toLowerCase() ?? "";

      if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
      }

      return token;
    },

    /**
     * 3) Pasar id y role de token → session.user
     */
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        session.user.role = (token.role as string) ?? "OPERATOR";
      }
      return session;
    },
  },
};
