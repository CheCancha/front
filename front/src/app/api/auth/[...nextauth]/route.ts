import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import {db} from "@/lib/db";

export const authOptions: AuthOptions = {
  // 1. Adaptador de Prisma
  adapter: PrismaAdapter(db),

  // 2. Providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // La lógica de autorización para el login con teléfono y contraseña
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        // Buscamos al usuario en la base de datos por su número de teléfono
        const user = await db.user.findUnique({
          where: { phone: credentials.phone },
        });

        // Si no se encuentra el usuario o no tiene contraseña, es un error
        if (!user || !user.hashedPassword) {
          throw new Error("Credenciales incorrectas");
        }

        // Comparamos la contraseña enviada con la hasheada en la base de datos
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isCorrectPassword) {
          throw new Error("Credenciales incorrectas");
        }

        return user;
      },
    }),
  ],

  // 3. Estrategia de Sesión: Usamos JSON Web Tokens (JWT) para manejar las sesiones.
  session: {
    strategy: "jwt",
  },

  // 4. Callbacks: Permiten personalizar el comportamiento de NextAuth.
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; 
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "MANAGER" | "ADMIN";
      }
      return session;
    },
  },

  // 5. Configuración Adicional
  secret: process.env.NEXTAUTH_SECRET, 
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
