import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logError } from "@/lib/utils/error-log";

/**
 * Shared rate-limit store.
 *
 * Counters live in the existing Neon PostgreSQL database rather than in process
 * memory, because the app runs on more than one server instance. An in-memory
 * `Map` is per-instance: a caller that rotated across instances would never hit
 * its own limit. Reading and writing every counter through the database makes
 * one limit apply to all instances.
 *
 * The counter is a fixed window: the first request in a window creates the row
 * and every later request in the same window increments it. The window is only
 * extended by a request that *starts* a new window, so a client cannot keep a
 * window alive forever by hammering it.
 *
 * Counting is a single atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`.
 * Doing the read-modify-write in one statement means two concurrent requests
 * cannot each read the same count and both decide they are under the limit,
 * which would let a burst slip past the threshold.
 */

export const RATE_LIMIT_SCOPES = {
  loginIp: "login:ip",
  loginAccount: "login:account",
  signupIp: "signup:ip",
  passwordResetIp: "password-reset:ip",
  passwordResetAccount: "password-reset:account",
  verifyEmailIp: "verify-email:ip",
  verifyEmailAccount: "verify-email:account",
  verifyEmailResendIp: "verify-email:resend-ip",
  contactIp: "contact:ip",
  paymentsIp: "payments:ip",
} as const;

export type RateLimitScope =
  (typeof RATE_LIMIT_SCOPES)[keyof typeof RATE_LIMIT_SCOPES];

export interface RateLimitPolicy {
  /** Maximum number of requests permitted inside the window. */
  limit: number;
  /** Length of the fixed window. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Whole seconds until the window resets; suitable for `Retry-After`. */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  scope: RateLimitScope;
  /**
   * The thing being limited: a client IP, or an identifier such as an email
   * address. It is hashed before storage so raw identifiers are not persisted.
   */
  key: string;
  policy: RateLimitPolicy;
  /** Injectable clock, for tests. */
  now?: Date;
}

/**
 * Per-endpoint policies, in one place so the limits are easy to review and
 * tune. Windows are deliberately generous enough not to obstruct normal use:
 * a shopper who mistypes a password, or retries a form twice, is unaffected.
 */
export const RATE_LIMIT_POLICIES = {
  /** Broad per-IP guard on sign-in attempts. */
  loginIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  /**
   * Per-account guard on *failed* sign-in attempts. This is what stops a
   * distributed attack (many IPs, one account) that a per-IP limit cannot see.
   */
  loginAccount: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Account creation is expensive (two emails + bcrypt); keep it scarce. */
  signupIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Reset requests send mail, so they are the most tightly held. */
  passwordResetIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Per-account cap so one address cannot be mail-bombed from many IPs. */
  passwordResetAccount: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Resend-verification requests, per IP and per account. */
  verifyEmailIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  verifyEmailAccount: { limit: 5, windowMs: 60 * 60 * 1000 },
  /**
   * Resend-verification requests per connection. Separate from `verifyEmailIp`
   * (which meters link clicks) so that clicking a link never eats into the
   * budget for asking for a new one.
   */
  verifyEmailResendIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Contact form sends mail to the store inbox. */
  contactIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  /**
   * Checkout initialisation talks to Paystack and writes orders. Guests are
   * allowed to check out, so the limit is per IP.
   */
  paymentsIp: { limit: 15, windowMs: 10 * 60 * 1000 },
} satisfies Record<keyof typeof RATE_LIMIT_SCOPES, RateLimitPolicy>;

export function hashRateLimitKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function buildRowId(scope: string, counterKey: string): string {
  return `${scope}:${counterKey}`;
}

/**
 * Records one request against the policy and reports whether it is permitted.
 *
 * Fails **open** on an infrastructure error (logging it): the limiter is a
 * protective layer, and a database hiccup should not take authentication or
 * checkout down with it. Every caller still enforces its own authorization and
 * validation independently of this result.
 */
export async function consumeRateLimit({
  scope,
  key,
  policy,
  now = new Date(),
}: RateLimitOptions): Promise<RateLimitResult> {
  const counterKey = hashRateLimitKey(key);
  const id = buildRowId(scope, counterKey);

  try {
    const result = await db.execute<{
      count: number;
      windowExpiresAt: Date;
    }>(sql`
      INSERT INTO rate_limits (id, scope, counter_key, count, window_started_at, window_expires_at, updated_at)
      VALUES (${id}, ${scope}, ${counterKey}, 1, ${now}, ${new Date(
        now.getTime() + policy.windowMs
      )}, ${now})
      ON CONFLICT (id) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_expires_at <= ${now} THEN 1
          ELSE rate_limits.count + 1
        END,
        window_started_at = CASE
          WHEN rate_limits.window_expires_at <= ${now} THEN ${now}
          ELSE rate_limits.window_started_at
        END,
        window_expires_at = CASE
          WHEN rate_limits.window_expires_at <= ${now}
            THEN ${new Date(now.getTime() + policy.windowMs)}
          ELSE rate_limits.window_expires_at
        END,
        updated_at = ${now}
      RETURNING count, window_expires_at AS "windowExpiresAt"
    `);

    const row = result.rows[0];
    const count = Number(row?.count ?? 1);
    const expiresAt = row?.windowExpiresAt
      ? new Date(row.windowExpiresAt).getTime()
      : now.getTime() + policy.windowMs;

    const remaining = Math.max(0, policy.limit - count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((expiresAt - now.getTime()) / 1000)
    );

    return {
      allowed: count <= policy.limit,
      remaining,
      retryAfterSeconds,
    };
  } catch (error) {
    logError("[RateLimit] Store unavailable; allowing request", error);
    return {
      allowed: true,
      remaining: policy.limit,
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
    };
  }
}

/**
 * Reports the current state without consuming a request. Used to check a limit
 * that must not itself advance the counter (for example, deciding whether to
 * warn on a *successful* login against a failed-attempt budget).
 */
export async function peekRateLimit({
  scope,
  key,
  policy,
  now = new Date(),
}: RateLimitOptions): Promise<RateLimitResult> {
  const counterKey = hashRateLimitKey(key);

  try {
    const result = await db.execute<{
      count: number;
      windowExpiresAt: Date;
    }>(sql`
      SELECT count, window_expires_at AS "windowExpiresAt"
      FROM rate_limits
      WHERE scope = ${scope} AND counter_key = ${counterKey}
        AND window_expires_at > ${now}
      LIMIT 1
    `);

    const row = result.rows[0];
    if (!row) {
      return {
        allowed: true,
        remaining: policy.limit,
        retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
      };
    }

    const count = Number(row.count);
    const expiresAt = new Date(row.windowExpiresAt).getTime();

    return {
      allowed: count < policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((expiresAt - now.getTime()) / 1000)
      ),
    };
  } catch (error) {
    logError("[RateLimit] Store unavailable; allowing request", error);
    return {
      allowed: true,
      remaining: policy.limit,
      retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
    };
  }
}

/**
 * Clears a counter, e.g. after a successful sign-in so a legitimate user is not
 * held to the failures they made before getting the password right.
 */
export async function resetRateLimit({
  scope,
  key,
}: Pick<RateLimitOptions, "scope" | "key">): Promise<void> {
  const counterKey = hashRateLimitKey(key);
  try {
    await db.execute(
      sql`DELETE FROM rate_limits WHERE scope = ${scope} AND counter_key = ${counterKey}`
    );
  } catch (error) {
    // Non-fatal: the counter simply expires on its own.
    logError("[RateLimit] Failed to clear counter", error);
  }
}
