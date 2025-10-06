import { Role } from "@prisma/client";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      complexId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    complexId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    complexId: string | null;
  }
}