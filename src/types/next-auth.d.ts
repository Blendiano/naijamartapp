import type { DefaultSession, DefaultJWT } from "next-auth";

// Extend the built-in session/jwt types to include role and id
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
    };
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    sid?: string;
  }
}
