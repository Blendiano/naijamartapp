import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { ZodType } from "zod";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/utils/error-log";

/**
 * Shared helpers for API route handlers.
 *
 * Every route answers with the same envelope:
 *   success: `{ success: true, data }`
 *   failure: `{ success: false, error: { message, details? } }`
 * so clients can read `error.message` without per-route exceptions.
 */

/** Builds the standard error response. `details` is omitted when undefined. */
export function jsonError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export type ParseBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Validates an already-parsed JSON body against a Zod schema.
 *
 * Failures answer `400 Validation failed` with the Zod issue format as
 * `details`, matching the envelope used by the checkout and cart routes.
 */
export function parseBody<T>(
  schema: ZodType<T>,
  data: unknown
): ParseBodyResult<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError("Validation failed", 400, parsed.error.format()),
    };
  }
  return { ok: true, data: parsed.data };
}

export type RequireAdminResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/**
 * Server-side admin authorization guard (AGENTS.md §13).
 *
 * Authorization is checked here rather than only by hiding admin UI, so a
 * hand-typed admin URL cannot bypass it.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { ok: false, response: jsonError("Unauthorized", 403) };
  }
  return { ok: true, session };
}

/**
 * Logs an unexpected route failure (sanitised by `logError`) and answers with
 * a safe, plain-language message. `error.message` is never returned to the
 * client: it may contain SQL, driver details or other internals (AGENTS.md §16).
 */
export function handleRouteError(
  error: unknown,
  context: string,
  message: string,
  status = 400
): NextResponse {
  logError(context, error);
  return jsonError(message, status);
}
