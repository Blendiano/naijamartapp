import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
  isEmailVerificationTokenExpired,
} from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { handleRouteError } from "@/lib/api-routes";
import { logError } from "@/lib/utils/error-log";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { tooManyRequests } from "@/lib/security/http";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(req: Request) {
  try {
    // Unauthenticated token-guessing surface: cheap to attack, so metered per
    // IP. Tokens are high-entropy, so a modest limit is enough.
    const clientIp = getClientIp(req.headers);
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.verifyEmailIp,
      key: clientIp,
      policy: RATE_LIMIT_POLICIES.verifyEmailIp,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "Too many verification attempts have been made."
      );
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: "This verification link is no longer valid. Please request a new verification email." } },
        { status: 400 }
      );
    }

    const tokenHash = hashEmailVerificationToken(token);
    const [user] = await db
      .select({
        id: users.id,
        emailVerified: users.emailVerified,
        emailVerificationCodeHash: users.emailVerificationCodeHash,
        emailVerificationExpiresAt: users.emailVerificationExpiresAt,
      })
      .from(users)
      .where(eq(users.emailVerificationCodeHash, tokenHash))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "This verification link is no longer valid. Please request a new verification email." } },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      const appUrl = getAppUrl();
      return NextResponse.redirect(new URL("/store?verified=already", appUrl), 302);
    }

    if (isEmailVerificationTokenExpired(user.emailVerificationExpiresAt)) {
      await db
        .update(users)
        .set({
          emailVerificationCodeHash: null,
          emailVerificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      return NextResponse.json(
        { success: false, error: { message: "This verification link has expired. Request a new verification email to continue." } },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const appUrl = getAppUrl();
    return NextResponse.redirect(new URL("/store?verified=success", appUrl), 302);
  } catch (error) {
    logError("[Auth] Verify email GET error", error);
    const appUrl = getAppUrl();
    return NextResponse.redirect(new URL("/store?verified=error", appUrl), 302);
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Resends send mail, so they are metered per account in the shared store.
    // The previous in-memory counter only applied to the single serverless
    // instance that happened to serve the request, so it could be bypassed by
    // retrying; the shared store makes the limit global.
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.verifyEmailAccount,
      key: session.user.id,
      policy: RATE_LIMIT_POLICIES.verifyEmailAccount,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "A verification email has already been sent recently."
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        emailVerificationExpiresAt: users.emailVerificationExpiresAt,
        emailVerificationCodeHash: users.emailVerificationCodeHash,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Your email is already verified." });
    }

    if (isEmailVerificationTokenExpired(user.emailVerificationExpiresAt)) {
      await db
        .update(users)
        .set({
          emailVerificationCodeHash: null,
          emailVerificationExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    const { token, tokenHash, expiresAt } = createEmailVerificationToken();
    const updateResult = await db
      .update(users)
      .set({
        emailVerificationCodeHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (updateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Failed to attach verification token" } },
        { status: 500 }
      );
    }

    const appUrl = getAppUrl();
    const verifyLink = appUrl + "/api/auth/verify-email?token=" + token;
    void sendVerificationEmail({
      to: user.email,
      name: user.name ?? "there",
      verifyLink,
    });

    return NextResponse.json({ success: true, message: "Verification email sent." });
  } catch (error) {
    return handleRouteError(
      error,
      "[Auth] Verify email POST error",
      "An unexpected error occurred",
      500
    );
  }
}
