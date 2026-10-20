import { invalidJsonBody, payloadTooLarge } from "./http";

/**
 * Request-body size enforcement.
 *
 * Route handlers stream their body, and `await req.json()` will happily buffer
 * whatever it is sent. Next.js' `proxyClientMaxBodySize` is not a substitute:
 * once a body exceeds it, the body is *truncated* with a warning rather than
 * rejected, so the oversized request still reaches the handler. These helpers
 * reject the request instead, before parsing.
 *
 * Reading is streamed rather than using `await req.text()`, so an attacker who
 * sends an endless body is cut off as soon as the budget is exceeded instead of
 * being buffered in full first.
 */

/** Body budgets per endpoint shape, in bytes. */
export const BODY_LIMITS = {
  /** Credentials, verification/reset payloads, cart mutations. */
  small: 8 * 1024,
  /** Contact form and other free-text payloads. */
  medium: 32 * 1024,
  /** Checkout initialisation with customer + delivery details. */
  large: 64 * 1024,
} as const;

export type BodyReadResult =
  | { ok: true; data: unknown }
  | { ok: false; response: ReturnType<typeof payloadTooLarge> };

function declaredLength(req: Request): number | null {
  const header = req.headers.get("content-length");
  if (!header) return null;
  const parsed = Number.parseInt(header, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function readBodyWithLimit(
  req: Request,
  maxBytes: number
): Promise<{ text: string } | { oversized: true }> {
  if (!req.body) return { text: "" };

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      bytes += value.byteLength;
      if (bytes > maxBytes) {
        // Stop pulling data as soon as the budget is blown.
        await reader.cancel().catch(() => {});
        return { oversized: true };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { text };
  } finally {
    reader.releaseLock?.();
  }
}

/**
 * Reads and parses a JSON body within `maxBytes`.
 *
 * Returns a ready-made error response when the body is oversized (`413`) or is
 * not valid JSON (`400`), so handlers can return it without repeating the
 * logic.
 */
export async function readJsonBody(
  req: Request,
  maxBytes: number
): Promise<BodyReadResult> {
  // A declared length lets an obviously oversized body be rejected without
  // reading anything. It is a hint only — the streaming check below is what
  // actually enforces the budget, since the header can be absent or wrong.
  const declared = declaredLength(req);
  if (declared !== null && declared > maxBytes) {
    return { ok: false, response: payloadTooLarge() };
  }

  const body = await readBodyWithLimit(req, maxBytes);
  if ("oversized" in body) {
    return { ok: false, response: payloadTooLarge() };
  }

  if (body.text.trim() === "") {
    return { ok: false, response: invalidJsonBody("A request body is required.") };
  }

  try {
    return { ok: true, data: JSON.parse(body.text) };
  } catch {
    return { ok: false, response: invalidJsonBody() };
  }
}
