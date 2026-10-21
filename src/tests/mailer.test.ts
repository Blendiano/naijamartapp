import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMail, verify } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail, verify })),
  },
}));

import {
  resetMailTransport,
  sendContactFormEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../lib/email/mailer";

const ORIGINAL_ENV = { ...process.env };

function setEnv(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

beforeEach(() => {
  sendMail.mockReset();
  verify.mockReset();
  sendMail.mockResolvedValue({ messageId: "<test@example.com>" });
  verify.mockResolvedValue(true);
  resetMailTransport();

  setEnv({
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "587",
    SMTP_USER: "store@example.com",
    SMTP_PASSWORD: "app-password",
    EMAIL_FROM: "store@example.com",
    NEXT_PUBLIC_APP_URL: "https://naijamart.ng",
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetMailTransport();
});

function lastMessage() {
  return sendMail.mock.calls.at(-1)?.[0] as Record<string, unknown>;
}

describe("verification email", () => {
  it("is delivered and carries both an HTML and a plain-text part", async () => {
    const result = await sendVerificationEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      verifyLink: "https://naijamart.ng/api/auth/verify-email?token=abc",
      expiresInMinutes: 15,
    });

    expect(result.delivered).toBe(true);
    expect(result.messageId).toBe("<test@example.com>");

    const message = lastMessage();
    expect(message.to).toBe("customer@example.com");
    expect(typeof message.html).toBe("string");
    expect(typeof message.text).toBe("string");
    expect(message.text as string).toContain(
      "https://naijamart.ng/api/auth/verify-email?token=abc"
    );
  });

  it("puts the verification link in the message body", async () => {
    const link = "https://naijamart.ng/api/auth/verify-email?token=abc";
    await sendVerificationEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      verifyLink: link,
      expiresInMinutes: 15,
    });

    const message = lastMessage();
    expect(message.html as string).toContain(link);
  });

  it("escapes user supplied names in the HTML body", async () => {
    await sendVerificationEmail({
      to: "customer@example.com",
      name: '<script>alert("x")</script>',
      verifyLink: "https://naijamart.ng/api/auth/verify-email?token=abc",
      expiresInMinutes: 15,
    });

    const message = lastMessage();
    expect(message.html as string).not.toContain("<script>");
    expect(message.html as string).toContain("&lt;script&gt;");
  });

  it("reports a failure instead of silently claiming success", async () => {
    sendMail.mockRejectedValue(new Error("550 mailbox unavailable"));

    const result = await sendVerificationEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      verifyLink: "https://naijamart.ng/api/auth/verify-email?token=abc",
      expiresInMinutes: 15,
    });

    expect(result.delivered).toBe(false);
    expect(result.reason).toBeTruthy();
    expect(result.reason).not.toContain("550 mailbox unavailable");
  });

  it("fails cleanly when SMTP credentials are missing", async () => {
    delete process.env.SMTP_PASSWORD;
    resetMailTransport();

    const result = await sendVerificationEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      verifyLink: "https://naijamart.ng/api/auth/verify-email?token=abc",
      expiresInMinutes: 15,
    });

    expect(result.delivered).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe("sender address", () => {
  it("uses the authenticated account when Google would reject the From address", async () => {
    setEnv({ EMAIL_FROM: "noreply@naijamart.ng" });

    await sendWelcomeEmail({
      to: "customer@example.com",
      name: "Amina Bello",
    });

    const message = lastMessage();
    expect(message.from as string).toContain("store@example.com");
    expect(message.from as string).not.toContain("naijamart.ng");
  });

  it("uses the configured From address on a non-Google host", async () => {
    setEnv({
      SMTP_HOST: "smtp.mailtrap.io",
      EMAIL_FROM: "noreply@naijamart.ng",
    });
    resetMailTransport();

    await sendWelcomeEmail({
      to: "customer@example.com",
      name: "Amina Bello",
    });

    const message = lastMessage();
    expect(message.from as string).toContain("noreply@naijamart.ng");
  });

  it("strips line breaks from a subject built from user input", async () => {
    await sendWelcomeEmail({
      to: "customer@example.com",
      name: "Amina\r\nBcc: attacker@example.com",
    });

    const message = lastMessage();
    expect(message.subject as string).not.toContain("\r");
    expect(message.subject as string).not.toContain("\n");
  });
});

describe("other transactional emails", () => {
  it("sends the password reset email", async () => {
    const result = await sendPasswordResetEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      resetLink: "https://naijamart.ng/auth/reset-password?token=abc",
    });

    expect(result.delivered).toBe(true);
    expect(lastMessage().text as string).toContain(
      "https://naijamart.ng/auth/reset-password?token=abc"
    );
  });

  it("sends the order confirmation email", async () => {
    const result = await sendOrderConfirmationEmail({
      to: "customer@example.com",
      name: "Amina Bello",
      orderNumber: "NJM-20260923-X4K2",
      amount: "₦25,000",
      orderLink: "https://naijamart.ng/orders/2f0f5f0e-0000-0000-0000-000000000000",
    });

    expect(result.delivered).toBe(true);
    const message = lastMessage();
    expect(message.subject as string).toContain("NJM-20260923-X4K2");
    expect(message.text as string).toContain("₦25,000");
  });

  it("sends the contact form message to the store inbox with a reply-to address", async () => {
    const result = await sendContactFormEmail({
      name: "Amina Bello",
      email: "customer@example.com",
      subject: "Order question",
      message: "When will my order arrive?",
      orderNumber: "NJM-20260923-X4K2",
    });

    expect(result.delivered).toBe(true);
    const message = lastMessage();
    expect(message.to).toBe("store@example.com");
    expect(message.replyTo as string).toContain("customer@example.com");
    expect(message.text as string).toContain("When will my order arrive?");
  });
});
