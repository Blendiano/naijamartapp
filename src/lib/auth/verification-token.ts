import { createHash, randomBytes } from "node:crypto";

/**
 * Email-verification tokens.
 *
 * This module is intentionally free of database and network imports so it can
 * be unit tested on its own; persistence lives in `verification-store.ts`.
 */

const DEFAULT_TTL_MINUTES = 15;

/**
 * How long a verification link stays usable.
 *
 * The link is opened from an inbox, so the expiry has to survive mail delivery
 * and the time it takes a customer to find and click it — including on a
 * different device. The previous two-minute window expired while the message
 * was still being read.
 *
 * Override with `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES` (minimum 5).
 */
export function getEmailVerificationTtlMs(): number {
  const configured = Number.parseInt(
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES ?? "",
    10
  );
  const minutes =
    Number.isInteger(configured) && configured >= 5
      ? configured
      : DEFAULT_TTL_MINUTES;
  return minutes * 60 * 1000;
}

/** The verification window in whole minutes, for user-facing copy. */
export function getEmailVerificationTtlMinutes(): number {
  return Math.round(getEmailVerificationTtlMs() / 60000);
}

export interface EmailVerificationToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createEmailVerificationToken(
  now: Date = new Date()
): EmailVerificationToken {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(now.getTime() + getEmailVerificationTtlMs()),
  };
}

export function isEmailVerificationTokenExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}
