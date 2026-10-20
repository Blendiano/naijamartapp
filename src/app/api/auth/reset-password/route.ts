import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getFirstUnmetRule,
  PASSWORD_RULE_MESSAGES,
} from "@/lib/auth/password-rules";
import {
  hashPasswordResetToken,
  isPasswordResetTokenExpired,
} from "@/lib/auth/reset-token";
import { deleteUserSessions } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api-routes";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { tooManyRequests } from "@/lib/security/http";

const INVALID_TOKEN_MESSAGE =
  "This reset link is invalid or has expired. Please request a new one.";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "This reset link is invalid or has expired."),
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
  confirmPassword: z.string().min(1, "This field cannot be empty"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    // The token is high-entropy, but this endpoint performs a bcrypt hash and
    // an unauthenticated caller could otherwise pin CPU, so it is metered.
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.passwordResetIp,
      key: getClientIp(req.headers),
      policy: RATE_LIMIT_POLICIES.passwordResetIp,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "Too many password reset attempts have been made."
      );
    }

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const result = resetPasswordSchema.safeParse(body.data);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: issue?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    const tokenHash = hashPasswordResetToken(token.trim());

    const [user] = await db
      .select({
        id: users.id,
        passwordResetExpiresAt: users.passwordResetExpiresAt,
      })
      .from(users)
      .where(eq(users.passwordResetTokenHash, tokenHash))
      .limit(1);

    if (!user || isPasswordResetTokenExpired(user.passwordResetExpiresAt)) {
      return NextResponse.json(
        { success: false, error: { message: INVALID_TOKEN_MESSAGE } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Single-use token: consume it in the same statement that stores the new
    // password. The row only matches while the stored hash is still this
    // token's and it has not expired, so a replay of an already consumed link
    // updates nothing and is rejected below.
    const consumed = await db
      .update(users)
      .set({
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, user.id),
          eq(users.passwordResetTokenHash, tokenHash),
          gt(users.passwordResetExpiresAt, new Date())
        )
      )
      .returning({ id: users.id });

    if (consumed.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: INVALID_TOKEN_MESSAGE } },
        { status: 400 }
      );
    }

    // Revoke every session issued before the reset so a stolen session (or the
    // token itself) cannot outlive the password change.
    await deleteUserSessions(user.id);

    return NextResponse.json(
      { success: true, message: "Your password has been updated." },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Auth] Reset password error",
      "An unexpected error occurred. Please try again later.",
      500
    );
  }
}
