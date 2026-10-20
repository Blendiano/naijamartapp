import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  createSession,
  deleteSession,
  getActiveSession,
  SESSION_TTL_SECONDS,
} from "./session";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  peekRateLimit,
  resetRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { decideAccountThrottle } from "@/lib/security/login-throttle";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: SESSION_TTL_SECONDS,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-authjs.session-token`
          : `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Host-authjs.csrf-token`
          : `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? `__Secure-authjs.callback-url`
          : `authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Normalise the same way signup does. Without this, an account whose
        // address contains uppercase characters could not sign in, and the
        // per-account throttle would treat one account as several.
        const email = parsed.data.email.toLowerCase().trim();
        const { password } = parsed.data;

        const clientIp = request
          ? getClientIp(request.headers)
          : "unknown";

        // Broad per-IP ceiling, enforced before any credential work so a spray
        // of attempts cannot even reach the password comparison.
        const ipLimit = await consumeRateLimit({
          scope: RATE_LIMIT_SCOPES.loginIp,
          key: clientIp,
          policy: RATE_LIMIT_POLICIES.loginIp,
        });
        if (!ipLimit.allowed) return null;

        // Per-account state is read *before* counting this attempt, so the
        // decision below reflects the failures that preceded it.
        const accountState = await peekRateLimit({
          scope: RATE_LIMIT_SCOPES.loginAccount,
          key: email,
          policy: RATE_LIMIT_POLICIES.loginAccount,
        });

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // The password is compared even when the account does not exist, so
        // the response time does not disclose whether the address is real.
        const passwordHash =
          user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const isValid = await bcrypt.compare(password, passwordHash);

        if (!user || !user.passwordHash || !isValid) {
          const decision = decideAccountThrottle(!accountState.allowed, false);

          // An over-budget account refuses a wrong password without advancing
          // the counter further; under budget, the failure is recorded.
          if (decision.action === "proceed") {
            await consumeRateLimit({
              scope: RATE_LIMIT_SCOPES.loginAccount,
              key: email,
              policy: RATE_LIMIT_POLICIES.loginAccount,
            });
          }
          return null;
        }

        // Correct password for an over-budget account is honoured rather than
        // refused: a hard lockout would let anyone lock a victim out. The
        // failure budget is then cleared.
        await resetRateLimit({
          scope: RATE_LIMIT_SCOPES.loginAccount,
          key: email,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "customer";

        const { sessionToken } = await createSession(user.id);
        token.sid = sessionToken;

        return token;
      }

      const sessionToken = token.sid as string | undefined;
      if (sessionToken) {
        const active = await getActiveSession(sessionToken);
        if (!active) {
          return null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message) {
        const sessionToken = message.token?.sid as string | undefined;
        if (sessionToken) {
          await deleteSession(sessionToken);
        }
      }
    },
  },
});
