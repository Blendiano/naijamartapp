import { logError } from "@/lib/utils/error-log";

/**
 * Public base-URL resolution.
 *
 * Links that leave the application by email (email verification, password
 * reset) are opened by the recipient — often on a different device, often
 * minutes or hours after the request was made. They must therefore point at the
 * deployed origin and never at a development placeholder such as
 * `http://localhost:3000`.
 *
 * Resolution order:
 *
 *   1. `NEXT_PUBLIC_APP_URL` — the configured public origin. This is the
 *      canonical value and always wins when it is usable.
 *   2. The origin of the incoming request — used when the configured value is
 *      missing or is still the local-development placeholder, so a deployment
 *      that forgot to set the variable still produces working links instead of
 *      `localhost` links that only resolve on the developer's own machine.
 *   3. `http://localhost:3000` — local development fallback.
 */

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

/** True when the hostname points at the local machine rather than a deployment. */
export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname.trim().toLowerCase());
}

/**
 * Reduces a configured URL to its origin, or returns `null` when it is not a
 * usable absolute http(s) URL.
 */
export function normalizeBaseUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function firstValue(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0]?.trim();
  return first ? first : null;
}

/**
 * Derives the public origin of the incoming request.
 *
 * Only the `Host` header is consulted. Forwarded-host headers are ignored on
 * purpose: they are attacker-controllable on a bare deployment, and a
 * forged host here would put a hostile domain inside the verification link.
 * The `Host` header has already been validated by the edge/proxy that routed
 * the request to this application.
 */
export function originFromHeaders(headers: Headers): string | null {
  const host = headers.get("host")?.trim();
  if (!host) return null;

  const forwardedProto = firstValue(headers.get("x-forwarded-proto"));
  const protocol =
    forwardedProto ??
    (isLocalHostname(host) || host.startsWith("localhost:") ? "http" : "https");

  return normalizeBaseUrl(`${protocol}://${host}`);
}

export interface ResolveAppUrlOptions {
  /** Value of `NEXT_PUBLIC_APP_URL`, if any. */
  configuredUrl?: string | null;
  /** The incoming request, when one is available. */
  request?: { headers: Headers } | null;
  /** Overrides the production check. Defaults to `NODE_ENV === "production"`. */
  isProduction?: boolean;
  /** Last-resort origin. */
  fallback?: string;
}

/**
 * Returns the public origin to use when building links for this application.
 */
export function resolveAppUrl({
  configuredUrl,
  request = null,
  isProduction = process.env.NODE_ENV === "production",
  fallback = "http://localhost:3000",
}: ResolveAppUrlOptions = {}): string {
  const configured = normalizeBaseUrl(configuredUrl);
  const requestOrigin = request ? originFromHeaders(request.headers) : null;

  const candidates = [configured, requestOrigin].filter(
    (value): value is string => Boolean(value)
  );

  for (const candidate of candidates) {
    const hostname = new URL(candidate).hostname;
    // In production a local hostname is never a usable public origin.
    if (!isProduction || !isLocalHostname(hostname)) {
      return candidate;
    }
  }

  if (isProduction) {
    logError(
      "[AppUrl] No public origin could be resolved; links will point at localhost",
      "Set NEXT_PUBLIC_APP_URL to the deployed origin (for example https://naijamart.ng)."
    );
  }

  return configured ?? requestOrigin ?? fallback;
}

/**
 * The configured public origin, without request-derived fallbacks.
 *
 * Used by background work (mail dispatch) that has no request to inspect.
 */
export function getConfiguredAppUrl(): string {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000"
  );
}

/** Builds an absolute URL for an application path, e.g. `/auth/login`. */
export function buildAppUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
