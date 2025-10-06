import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { normalizePhoneNumber } from "@/shared/lib/utils";
import { db } from "@/shared/lib/db";
import bcrypt from "bcrypt";

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

        const isEmail = login.includes("@");

        let user;
        if (isEmail) {
          user = await db.user.findUnique({
            where: { email: login.toLowerCase() },
            include: { managedComplex: { select: { id: true } } },
          });
        } else {
          const normalizedPhone = normalizePhoneNumber(login);
          user = await db.user.findUnique({
            where: { phone: normalizedPhone },
            include: { managedComplex: { select: { id: true } } },
          });
        }

        if (!user || !user.hashedPassword) return null;

        const passwordMatch = await bcrypt.compare(
          password,
          user.hashedPassword
        );
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
