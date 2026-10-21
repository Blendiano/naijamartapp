import { describe, it, expect, afterEach } from "vitest";
import {
  createEmailVerificationToken,
  getEmailVerificationTtlMinutes,
  getEmailVerificationTtlMs,
  hashEmailVerificationToken,
  isEmailVerificationTokenExpired,
} from "../lib/auth/verification-token";

const ORIGINAL_TTL = process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;

afterEach(() => {
  if (ORIGINAL_TTL === undefined) {
    delete process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;
  } else {
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = ORIGINAL_TTL;
  }
});

describe("email verification token lifetime", () => {
  it("keeps a link valid for at least five minutes by default", () => {
    delete process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES;
    expect(getEmailVerificationTtlMs()).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(getEmailVerificationTtlMinutes()).toBeGreaterThanOrEqual(5);
  });

  it("uses a configured lifetime when it is valid", () => {
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = "45";
    expect(getEmailVerificationTtlMinutes()).toBe(45);
  });

  it("ignores a configured lifetime that is too short", () => {
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = "1";
    expect(getEmailVerificationTtlMinutes()).toBeGreaterThanOrEqual(5);
  });

  it("ignores a configured lifetime that is not a number", () => {
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = "soon";
    expect(getEmailVerificationTtlMinutes()).toBeGreaterThanOrEqual(5);
  });
});

describe("createEmailVerificationToken", () => {
  it("produces a token and its matching hash", () => {
    const { token, tokenHash } = createEmailVerificationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashEmailVerificationToken(token));
  });

  it("produces a different token every time", () => {
    const first = createEmailVerificationToken();
    const second = createEmailVerificationToken();
    expect(first.token).not.toBe(second.token);
  });

  it("expires the token after the configured window", () => {
    process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = "10";
    const now = new Date("2026-01-01T00:00:00.000Z");
    const { expiresAt } = createEmailVerificationToken(now);
    expect(expiresAt.getTime()).toBe(now.getTime() + 10 * 60 * 1000);
  });
});

describe("isEmailVerificationTokenExpired", () => {
  it("treats a missing expiry as expired", () => {
    expect(isEmailVerificationTokenExpired(null)).toBe(true);
    expect(isEmailVerificationTokenExpired(undefined)).toBe(true);
  });

  it("is not expired before the deadline", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 60_000);
    expect(isEmailVerificationTokenExpired(expiresAt, now)).toBe(false);
  });

  it("is expired at and after the deadline", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime());
    expect(isEmailVerificationTokenExpired(expiresAt, now)).toBe(true);
    expect(
      isEmailVerificationTokenExpired(new Date(now.getTime() - 1), now)
    ).toBe(true);
  });
});
