import { createHash, randomBytes } from "node:crypto";

export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

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
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
  };
}

export function isEmailVerificationTokenExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}