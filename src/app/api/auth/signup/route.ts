import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email/mailer";
import { getFirstUnmetRule, PASSWORD_RULE_MESSAGES } from "@/lib/auth/password-rules";
import { createEmailVerificationToken } from "@/lib/auth/verification-token";
import { handleRouteError } from "@/lib/api-routes";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { tooManyRequests } from "@/lib/security/http";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .regex(
        /^\S+(\s+\S+)+$/,
        "Enter both first and last name separated by a space"
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "This field cannot be empty")
      .superRefine((value, ctx) => {
        const unmet = getFirstUnmetRule(value);
        if (unmet) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: PASSWORD_RULE_MESSAGES[unmet.id],
          });
        }
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req.headers);

    // Account creation triggers two emails and a bcrypt hash, so it is limited
    // per IP before any of that work happens.
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.signupIp,
      key: clientIp,
      policy: RATE_LIMIT_POLICIES.signupIp,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "Too many accounts have been created from this connection."
      );
    }

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const result = signupSchema.safeParse(body.data);
    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: issue?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "An account with this email already exists." },
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        role: "customer",
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    if (newUser) {
      void sendWelcomeEmail({
        to: newUser.email,
        name: newUser.name ?? name,
      });
      const { token, tokenHash, expiresAt } = createEmailVerificationToken();
      const updateResult = await db
        .update(users)
        .set({ emailVerificationCodeHash: tokenHash, emailVerificationExpiresAt: expiresAt, updatedAt: new Date() })
        .where(eq(users.id, newUser.id))
        .returning({ id: users.id });
      if (updateResult.length > 0) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const verifyLink = appUrl + "/api/auth/verify-email?token=" + token;
        void sendVerificationEmail({ to: newUser.email, name: newUser.name ?? name, verifyLink });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // The first-issue validation envelope above is what signup-form.tsx
    // renders, so only the unexpected-failure catch is routed through the
    // shared helper (identical response, sanitised logging).
    return handleRouteError(
      error,
      "[Auth] Signup error",
      "An unexpected error occurred. Please try again later.",
      500
    );
  }
}
