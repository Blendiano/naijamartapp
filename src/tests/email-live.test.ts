import { describe, it, expect } from "vitest";
import {
  resetMailTransport,
  sendContactFormEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  verifySmtpConnection,
} from "../lib/email/mailer";

/**
 * Live SMTP test.
 *
 * It talks to the real mail server, so it only runs when it is asked for:
 *
 *   npm run test:email
 *
 * The recipient defaults to the authenticated SMTP account and can be
 * overridden with `EMAIL_TEST_RECIPIENT`.
 */
const LIVE = process.env.RUN_LIVE_EMAIL_TESTS === "1";
const RECIPIENT = process.env.EMAIL_TEST_RECIPIENT ?? process.env.SMTP_USER ?? "";

describe.skipIf(!LIVE)("live SMTP delivery", () => {
  it("authenticates against the configured SMTP server", async () => {
    resetMailTransport();
    const result = await verifySmtpConnection();
    expect(result.delivered).toBe(true);
  });

  it("delivers every transactional email", async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://naijamart.ng";

    const results = await Promise.all([
      sendWelcomeEmail({
        to: RECIPIENT,
        name: "NaijaMart Mail Test",
        appUrl,
      }),
      sendVerificationEmail({
        to: RECIPIENT,
        name: "NaijaMart Mail Test",
        verifyLink: `${appUrl}/api/auth/verify-email?token=live-test-token`,
        expiresInMinutes: 15,
      }),
      sendPasswordResetEmail({
        to: RECIPIENT,
        name: "NaijaMart Mail Test",
        resetLink: `${appUrl}/auth/reset-password?token=live-test-token`,
      }),
      sendOrderConfirmationEmail({
        to: RECIPIENT,
        name: "NaijaMart Mail Test",
        orderNumber: "NJM-TEST-0001",
        amount: "₦25,000",
        orderLink: `${appUrl}/orders/live-test-order`,
      }),
      sendContactFormEmail({
        name: "NaijaMart Mail Test",
        email: RECIPIENT,
        subject: "Live mail test",
        message: "This message was sent by the NaijaMart mail test.",
        orderNumber: "NJM-TEST-0001",
      }),
    ]);

    const labels = [
      "welcome",
      "verification",
      "password reset",
      "order confirmation",
      "contact form",
    ];

    results.forEach((result, index) => {
      // The reason is printed so a failed run says why, without leaking
      // credentials.
      expect(
        result.delivered,
        `${labels[index]} email was not delivered: ${result.reason ?? "unknown reason"}`
      ).toBe(true);
    });
  });
});
