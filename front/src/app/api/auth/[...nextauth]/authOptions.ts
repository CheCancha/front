// src/app/api/auth/[...nextauth]/authOptions.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions, type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { normalizePhoneNumber } from "@/lib/utils";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; complexId?: string | null } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    complexId?: string | null;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    complexId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Teléfono", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const normalizedPhone = normalizePhoneNumber(credentials.phone);
        const user = await db.user.findUnique({
          where: { phone: normalizedPhone },
          include: { managedComplex: { select: { id: true } } },
        });
        if (!user || !user.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          complexId: user.managedComplex?.id || null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.complexId = user.complexId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.complexId = token.complexId;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
