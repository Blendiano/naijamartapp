import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email/mailer";
import { createPasswordResetToken } from "@/lib/auth/reset-token";
import { handleRouteError } from "@/lib/api-routes";
import { logError } from "@/lib/utils/error-log";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { tooManyRequests } from "@/lib/security/http";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req.headers);

    // This endpoint sends email, so it is the most tightly limited. The IP
    // limit is applied first because it does not depend on the submitted
    // address and therefore cannot be used to probe which address is real.
    const ipLimit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.passwordResetIp,
      key: clientIp,
      policy: RATE_LIMIT_POLICIES.passwordResetIp,
    });
    if (!ipLimit.allowed) {
      return tooManyRequests(
        ipLimit,
        "Too many password reset requests have been made."
      );
    }

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const result = forgotPasswordSchema.safeParse(body.data);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: issue?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Per-account budget, checked only for addresses that exist so its outcome
    // can never distinguish a real account from an unknown one — the generic
    // success response is returned either way.
    const accountLimit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.passwordResetAccount,
      key: normalizedEmail,
      policy: RATE_LIMIT_POLICIES.passwordResetAccount,
    });

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user && accountLimit.allowed) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();

      try {
        await db
          .update(users)
          .set({
            passwordResetTokenHash: tokenHash,
            passwordResetExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      } catch (error) {
        // Keep the generic response so a storage failure never reveals
        // whether the account exists.
        logError("[Auth] Failed to store password reset token", error);
        return NextResponse.json(
          {
            success: true,
            message:
              "If an account exists for this email, password reset instructions have been sent.",
          },
          { status: 200 }
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

      // Dispatch password reset email via Nodemailer
      void sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? "Customer",
        resetLink,
      });
    }

    // Always return safe generic success response to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists for this email, password reset instructions have been sent.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Auth] Forgot password error",
      "An unexpected error occurred. Please try again later.",
      500
    );
  }
}
