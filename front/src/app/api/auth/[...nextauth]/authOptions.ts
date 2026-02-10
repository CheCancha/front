import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { normalizePhoneNumber } from "@/shared/lib/utils";
import { db } from "@/shared/lib/db";
import { supabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        login: { label: "Email o Teléfono", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const { login, password } = credentials;
        let targetEmail = login.toLowerCase();

        if (!login.includes("@")) {
          const normalizedPhone = normalizePhoneNumber(login);
          const userRow = await db.user.findUnique({
            where: { phone: normalizedPhone },
            select: { email: true },
          });

          if (!userRow) return null;
          targetEmail = userRow.email;
        }

        // 2. Intentar Login en el motor central (Supabase)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: password,
        });

        if (error || !data.user) return null;

        // 3. Traer los datos de tu tabla User (Roles, Complejos, etc.)
        const dbUser = await db.user.findUnique({
          where: { id: data.user.id },
          include: { managedComplex: { select: { id: true } } },
        });

        if (!dbUser) return null;

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          complexId: dbUser.managedComplex?.id || null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          include: { managedComplex: { select: { id: true } } },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.complexId = dbUser.managedComplex?.id || null;
        }
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
