import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
} from "./verification-token";

/**
 * Persistence for email-verification tokens.
 *
 * Tokens are stored in the `verification_tokens` table, keyed by the user's
 * id in `identifier` and the SHA-256 hash of the token in `token`. Because the
 * primary key is `(identifier, token)`, a user can hold more than one live
 * token at a time.
 *
 * That matters for the customer journey: sending a new link must not silently
 * break the link that is already sitting in the customer's inbox. Every issued
 * link stays valid until it expires on its own.
 *
 * The `identifier` namespace is the user id, not the email address, so these
 * rows never collide with the tokens Auth.js stores in the same table.
 */

export interface IssuedVerificationToken {
  /** The raw token. Only this value is ever sent to the customer. */
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Issues a new verification token for a user and removes that user's expired
 * tokens. Tokens issued earlier stay valid until they expire.
 */
export async function issueEmailVerificationToken(
  userId: string
): Promise<IssuedVerificationToken> {
  const { token, tokenHash, expiresAt } = createEmailVerificationToken();
  const now = new Date();

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, userId),
        lt(verificationTokens.expires, now)
      )
    );

  await db
    .insert(verificationTokens)
    .values({ identifier: userId, token: tokenHash, expires: expiresAt })
    .onConflictDoNothing();

  return { token, tokenHash, expiresAt };
}

export interface VerificationTokenLookup {
  userId: string;
  expiresAt: Date;
  /** True when the token exists but its validity window has passed. */
  expired: boolean;
}

/**
 * Resolves a raw token to the user it was issued for.
 *
 * Returns `null` when no token matches, so an unknown token can be answered
 * with the same generic message as an expired one.
 */
export async function findUserByEmailVerificationToken(
  token: string
): Promise<VerificationTokenLookup | null> {
  if (!token) return null;

  const tokenHash = hashEmailVerificationToken(token);
  const [row] = await db
    .select({
      identifier: verificationTokens.identifier,
      expires: verificationTokens.expires,
    })
    .from(verificationTokens)
    .where(eq(verificationTokens.token, tokenHash))
    .limit(1);

  if (!row) return null;

  return {
    userId: row.identifier,
    expiresAt: row.expires,
    expired: row.expires.getTime() <= Date.now(),
  };
}

/** Removes every verification token belonging to a user. */
export async function deleteEmailVerificationTokens(
  userId: string
): Promise<void> {
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, userId));
}
