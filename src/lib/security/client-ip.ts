/**
 * Trusted client-IP detection.
 *
 * `x-forwarded-for` is a *list* that any client can prepend to. If the app
 * blindly trusted the left-most entry, an attacker could rotate the header on
 * every request and bypass every IP-based rate limit. So the header is only
 * consulted when the deployment explicitly declares which proxy is in front of
 * the app, and only the correct hop is read.
 *
 * `TRUSTED_PROXY` selects the strategy:
 *
 *   - `vercel`   Vercel's edge sets `x-real-ip` (single value) and appends the
 *                real client as the *first* hop of `x-vercel-forwarded-for`.
 *                Vercel overwrites both, so they cannot be spoofed.
 *   - `forwarded` Self-hosted behind a reverse proxy you control. The trusted
 *                hop count configures how many proxies from the *right* are
 *                ours; the client is the entry at that position counting from
 *                the right. `TRUSTED_PROXY_HOPS` (default 1) is the number of
 *                proxies, so with the default the left-most entry is used only
 *                after our own proxy has been peeled off.
 *   - `direct`   No proxy (local dev, direct container). The socket peer is the
 *                client; forwarded headers are ignored entirely.
 *
 * When unset the strategy is inferred: `vercel` on Vercel (detected via
 * `VERCEL`), otherwise `direct`. This fails safe — running with no configured
 * proxy ignores spoofable headers rather than trusting them.
 */

export const TRUSTED_PROXY_VALUES = ["vercel", "forwarded", "direct"] as const;
export type TrustedProxyMode = (typeof TRUSTED_PROXY_VALUES)[number];

export const UNKNOWN_IP = "unknown";

function parseMode(value: string | undefined): TrustedProxyMode | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return (TRUSTED_PROXY_VALUES as readonly string[]).includes(normalized)
    ? (normalized as TrustedProxyMode)
    : null;
}

export function getTrustedProxyMode(
  env: NodeJS.ProcessEnv = process.env
): TrustedProxyMode {
  return (
    parseMode(env.TRUSTED_PROXY) ?? (env.VERCEL ? "vercel" : "direct")
  );
}

/**
 * Normalises an address so the same client always maps to the same counter,
 * and so IPv4-mapped IPv6 (`::ffff:1.2.3.4`) does not create a second bucket
 * for an address that already has one.
 */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const value = raw.trim();
  if (!value) return null;

  // Reject anything that is not plausibly an IP literal. This keeps header
  // junk (ports, hostnames, `unknown`, injected commas) out of the store.
  const candidate =
    value.startsWith("[") && value.includes("]")
      ? value.slice(1, value.indexOf("]")) // [::1]:443 → ::1
      : value;

  const withoutZone = candidate.split("%")[0];
  const unmapped = withoutZone.toLowerCase().startsWith("::ffff:")
    ? withoutZone.slice("::ffff:".length)
    : withoutZone;

  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(unmapped);
  if (isIpv4) {
    const octets = unmapped.split(".").map(Number);
    if (octets.every((o) => o >= 0 && o <= 255)) return unmapped;
    return null;
  }

  const isIpv6 = /^[0-9a-f:]+$/i.test(unmapped) && unmapped.includes(":");
  if (isIpv6) return unmapped;

  return null;
}

/**
 * Resolves the client IP using only headers that the configured deployment
 * guarantees are trustworthy. Returns `UNKNOWN_IP` when no address can be
 * established; callers should bucket those requests together rather than
 * treating them as unlimited.
 */
export function getClientIp(
  headers: Headers,
  env: NodeJS.ProcessEnv = process.env
): string {
  const mode = getTrustedProxyMode(env);

  if (mode === "vercel") {
    // Vercel overwrites these at the edge, so the first hop is the client.
    const realIp = normalizeIp(headers.get("x-real-ip"));
    if (realIp) return realIp;

    const vercelChain = headers.get("x-vercel-forwarded-for");
    const fromVercel = firstHop(vercelChain);
    if (fromVercel) return fromVercel;
  }

  if (mode === "forwarded") {
    const chain = headers.get("x-forwarded-for");
    const hop = hopFromRight(chain, getTrustedProxyHops(env));
    if (hop) return hop;
  }

  return UNKNOWN_IP;
}

function getTrustedProxyHops(env: NodeJS.ProcessEnv): number {
  const parsed = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function splitChain(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function firstHop(value: string | null): string | null {
  for (const part of splitChain(value)) {
    const ip = normalizeIp(part);
    if (ip) return ip;
  }
  return null;
}

/**
 * Peels `hops` entries off the right-hand side of the chain. The entry at that
 * position is the client as seen by the outermost proxy we trust; anything to
 * its left was supplied by the client itself and is discarded.
 */
function hopFromRight(value: string | null, hops: number): string | null {
  const chain = splitChain(value);
  const index = chain.length - hops;
  if (index < 0 || index >= chain.length) return null;
  return normalizeIp(chain[index]);
}
