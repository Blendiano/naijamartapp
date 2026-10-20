import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";

/**
 * Builds the response returned when a limit is exceeded.
 *
 * `429 Too Many Requests` with `Retry-After` is what well-behaved clients need
 * in order to back off, and it is deliberately distinct from a `401`/`403` so a
 * throttled lock-out is never mistaken for a credential or permission problem.
 */
export function tooManyRequests(
  result: RateLimitResult,
  message = "Too many requests. Please try again later."
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { message },
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    }
  );
}

/** `413 Payload Too Large` for a body that exceeds the endpoint's budget. */
export function payloadTooLarge(
  message = "Request body is too large."
): NextResponse {
  return NextResponse.json(
    { success: false, error: { message } },
    { status: 413, headers: { "Cache-Control": "no-store" } }
  );
}

/** `400 Bad Request` for a body that is absent or not valid JSON. */
export function invalidJsonBody(
  message = "Request body must be valid JSON."
): NextResponse {
  return NextResponse.json(
    { success: false, error: { message } },
    { status: 400, headers: { "Cache-Control": "no-store" } }
  );
}
