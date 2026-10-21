import { describe, it, expect } from "vitest";
import {
  buildAppUrl,
  isLocalHostname,
  normalizeBaseUrl,
  originFromHeaders,
  resolveAppUrl,
} from "../lib/utils/app-url";

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe("normalizeBaseUrl", () => {
  it("reduces a configured URL to its origin", () => {
    expect(normalizeBaseUrl("https://naijamart.ng/store?a=1")).toBe(
      "https://naijamart.ng"
    );
  });

  it("rejects values that are not absolute http(s) URLs", () => {
    expect(normalizeBaseUrl("naijamart.ng")).toBeNull();
    expect(normalizeBaseUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeBaseUrl("")).toBeNull();
    expect(normalizeBaseUrl(undefined)).toBeNull();
  });
});

describe("isLocalHostname", () => {
  it("recognises the local development hosts", () => {
    expect(isLocalHostname("localhost")).toBe(true);
    expect(isLocalHostname("127.0.0.1")).toBe(true);
    expect(isLocalHostname("LOCALHOST")).toBe(true);
  });

  it("does not treat a deployed host as local", () => {
    expect(isLocalHostname("naijamart.ng")).toBe(false);
    expect(isLocalHostname("naijamart.vercel.app")).toBe(false);
  });
});

describe("originFromHeaders", () => {
  it("uses the Host header and https by default", () => {
    expect(originFromHeaders(headers({ host: "naijamart.ng" }))).toBe(
      "https://naijamart.ng"
    );
  });

  it("uses http for a local host", () => {
    expect(originFromHeaders(headers({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000"
    );
  });

  it("honours the forwarded protocol", () => {
    expect(
      originFromHeaders(
        headers({ host: "naijamart.ng", "x-forwarded-proto": "https" })
      )
    ).toBe("https://naijamart.ng");
  });

  it("ignores forwarded-host headers, which a client can forge", () => {
    expect(
      originFromHeaders(
        headers({
          host: "naijamart.ng",
          "x-forwarded-host": "attacker.example",
        })
      )
    ).toBe("https://naijamart.ng");
  });

  it("returns null when there is no host header", () => {
    expect(originFromHeaders(headers({}))).toBeNull();
  });
});

describe("resolveAppUrl", () => {
  it("prefers the configured public origin", () => {
    expect(
      resolveAppUrl({
        configuredUrl: "https://naijamart.ng",
        request: { headers: headers({ host: "naijamart.vercel.app" }) },
      })
    ).toBe("https://naijamart.ng");
  });

  it("falls back to the request origin when nothing is configured", () => {
    expect(
      resolveAppUrl({
        request: { headers: headers({ host: "naijamart.vercel.app" }) },
      })
    ).toBe("https://naijamart.vercel.app");
  });

  it("ignores a localhost placeholder in production and uses the request", () => {
    expect(
      resolveAppUrl({
        configuredUrl: "http://localhost:3000",
        request: { headers: headers({ host: "naijamart.vercel.app" }) },
        isProduction: true,
      })
    ).toBe("https://naijamart.vercel.app");
  });

  it("keeps a localhost origin outside production", () => {
    expect(
      resolveAppUrl({
        configuredUrl: "http://localhost:3000",
        isProduction: false,
      })
    ).toBe("http://localhost:3000");
  });

  it("falls back to the development origin when nothing is usable", () => {
    expect(resolveAppUrl({ isProduction: false })).toBe(
      "http://localhost:3000"
    );
  });

  it("ignores a forwarded-host header when deriving the origin", () => {
    expect(
      resolveAppUrl({
        request: {
          headers: headers({
            host: "naijamart.vercel.app",
            "x-forwarded-host": "attacker.example",
          }),
        },
      })
    ).toBe("https://naijamart.vercel.app");
  });
});

describe("buildAppUrl", () => {
  it("joins the origin and a path without doubling slashes", () => {
    expect(buildAppUrl("https://naijamart.ng", "/verify-email")).toBe(
      "https://naijamart.ng/verify-email"
    );
    expect(buildAppUrl("https://naijamart.ng/", "/verify-email")).toBe(
      "https://naijamart.ng/verify-email"
    );
    expect(buildAppUrl("https://naijamart.ng", "verify-email")).toBe(
      "https://naijamart.ng/verify-email"
    );
  });
});
