import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  deleteEmailVerificationTokens,
  findUserByEmailVerificationToken,
  issueEmailVerificationToken,
} from "@/lib/auth/verification-store";
import { getEmailVerificationTtlMinutes } from "@/lib/auth/verification-token";
import { sendVerificationEmail } from "@/lib/email/mailer";
import { handleRouteError } from "@/lib/api-routes";
import { logError } from "@/lib/utils/error-log";
import { buildAppUrl, resolveAppUrl } from "@/lib/utils/app-url";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { tooManyRequests } from "@/lib/security/http";

/**
 * Email verification.
 *
 * `GET /api/auth/verify-email?token=…` consumes a verification link.
 * `POST /api/auth/verify-email` sends a new one to the signed-in customer.
 *
 * The link is a bearer token: it carries its own validity window and works
 * from any device, because nothing about it is tied to the browser that asked
 * for it. Every link that has been issued stays usable until it expires, so
 * requesting a new link never breaks the one already sitting in an inbox.
 */

/** Where the customer lands after following a verification link. */
const RESULT_PAGE = "/verify-email";

type VerificationStatus =
  | "success"
  | "already"
  | "expired"
  | "invalid"
  | "error";

function redirectToResult(
  request: Request,
  status: VerificationStatus
): NextResponse {
  const appUrl = resolveAppUrl({
    configuredUrl: process.env.NEXT_PUBLIC_APP_URL,
    request,
  });
  return NextResponse.redirect(
    new URL(buildAppUrl(appUrl, `${RESULT_PAGE}?status=${status}`)),
    302
  );
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
      return redirectToResult(req, "invalid");
    }

    const match = await findUserByEmailVerificationToken(token);

    if (!match) {
      return redirectToResult(req, "invalid");
    }

    if (match.expired) {
      return redirectToResult(req, "expired");
    }

    const [user] = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, match.userId))
      .limit(1);

    if (!user) {
      return redirectToResult(req, "invalid");
    }

    if (user.emailVerified) {
      await deleteEmailVerificationTokens(user.id);
      return redirectToResult(req, "already");
    }

    await db
      .update(users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // The token is single-use: every outstanding link for this account is
    // consumed once the address has been confirmed.
    await deleteEmailVerificationTokens(user.id);

    return redirectToResult(req, "success");
  } catch (error) {
    logError("[Auth] Verify email GET error", error);
    return redirectToResult(req, "error");
  }
}

export async function POST(req: Request) {
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
    const accountLimit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.verifyEmailAccount,
      key: session.user.id,
      policy: RATE_LIMIT_POLICIES.verifyEmailAccount,
    });
    if (!accountLimit.allowed) {
      return tooManyRequests(
        accountLimit,
        "A verification email has already been sent recently."
      );
    }

    // A second, per-IP guard keeps a single connection from using up the
    // mail quota for many different accounts.
    const ipLimit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.verifyEmailResendIp,
      key: getClientIp(req.headers),
      policy: RATE_LIMIT_POLICIES.verifyEmailResendIp,
    });
    if (!ipLimit.allowed) {
      return tooManyRequests(
        ipLimit,
        "Too many verification emails have been requested from this connection."
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
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

    // A new link is issued alongside the outstanding ones rather than
    // replacing them, so an email that is already in the customer's inbox
    // keeps working.
    const { token, expiresAt } = await issueEmailVerificationToken(user.id);

    const appUrl = resolveAppUrl({
      configuredUrl: process.env.NEXT_PUBLIC_APP_URL,
      request: req,
    });
    const verifyLink = buildAppUrl(
      appUrl,
      `/api/auth/verify-email?token=${token}`
    );

    const expiresInMinutes = getEmailVerificationTtlMinutes();

    // The message is awaited rather than dispatched in the background: on a
    // serverless platform the invocation can be frozen the moment the response
    // is returned, and a background send would simply never happen.
    const result = await sendVerificationEmail({
      to: user.email,
      name: user.name ?? "there",
      verifyLink,
      expiresInMinutes,
    });

    if (!result.delivered) {
      // Report the failure instead of claiming the email was sent. The
      // underlying SMTP error is logged by the mailer.
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              result.reason ??
              "We could not send the verification email. Please try again shortly.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent.",
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes,
      retryAfter: 60,
    });
  } catch (error) {
    return handleRouteError(
      error,
      "[Auth] Verify email POST error",
      "An unexpected error occurred",
      500
    );
  }
}
