import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface PasswordResetToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(
  now: Date = new Date()
): PasswordResetToken {
  const token = nanoid(32);

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

export function isPasswordResetTokenExpired(
  expiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}
