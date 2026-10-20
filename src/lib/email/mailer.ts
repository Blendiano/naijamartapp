import nodemailer from "nodemailer";
import { logError } from "@/lib/utils/error-log";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error("Missing SMTP credentials");
  }
  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: { user: user, pass: pass },
  });
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "orders@naijamart.ng";

/**
 * User-supplied values are interpolated into HTML bodies. Escaping prevents
 * injected markup from rendering (or smuggling headers/links) in emails.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Strips CR/LF so user input cannot inject additional mail headers. */
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

export interface WelcomeEmailData {
  to: string;
  name: string;
}
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const t = createTransporter();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const name = escapeHtml(data.name);
    await t.sendMail({
      from: "\"NaijaMart\" <" + FROM_ADDRESS + ">",
      to: data.to,
      subject: sanitizeHeader("Welcome to NaijaMart, " + data.name + "!"),
      html: "<p>Hi " + name + ", welcome. <a href=\"" + appUrl + "/products\">Shop</a></p>",
    });
  } catch (e) {
    logError("[Email] Failed to send welcome email", e);
  }
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetLink: string;
}
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  try {
    const t = createTransporter();
    await t.sendMail({
      from: "\"NaijaMart Security\" <" + FROM_ADDRESS + ">",
      to: data.to,
      subject: "Reset your NaijaMart password",
      html: "<p>Hi " + escapeHtml(data.name) + ", <a href=\"" + data.resetLink + "\">Reset</a></p>",
    });
  } catch (e) {
    // Never log the message payload: the reset link contains a live token.
    logError("[Email] Failed to send password reset email", e);
  }
}

export interface VerificationEmailData {
  to: string;
  name: string;
  verifyLink: string;
}
export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  try {
    const t = createTransporter();
    const displayName =
      data.name && data.name.trim().length > 0 ? escapeHtml(data.name) : "there";
    const html = "<!DOCTYPE html><html><body><p>Hi " + displayName + ",</p><p>Welcome to NaijaMart!</p><p>Please verify your email address to complete your account setup.</p><p><a href=\"" + data.verifyLink + "\">Verify My Email</a></p><p>This verification link will expire after 2 minutes.</p><p>If you didn't create a NaijaMart account, you can safely ignore this email.</p><p>Thank you,<br/>The NaijaMart Team<br/>Nigerian Fashion, Elevated.</p></body></html>";
    await t.sendMail({
      from: "\"NaijaMart\" <" + FROM_ADDRESS + ">",
      to: data.to,
      subject: "Verify your email  NaijaMart",
      html,
    });
  } catch (e) {
    // Never log the message payload: the body contains a live verify link.
    logError("[Email] Failed to send verification email", e);
  }
}

export interface OrderConfirmationEmailData {
  to: string;
  name: string;
  orderNumber: string;
  amount: string;
  orderLink: string;
}
export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
  try {
    const t = createTransporter();
    await t.sendMail({
      from: "\"NaijaMart\" <" + FROM_ADDRESS + ">",
      to: data.to,
      subject: sanitizeHeader("Order Confirmation  " + data.orderNumber),
      html: "<p>Hi " + escapeHtml(data.name) + ", order " + escapeHtml(data.orderNumber) + " for " + escapeHtml(data.amount) + ". <a href=\"" + data.orderLink + "\">View</a></p>",
    });
  } catch (e) {
    logError("[Email] Failed to send order confirmation email", e);
  }
}

export interface ContactFormEmailData {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail(data: ContactFormEmailData): Promise<void> {
  const t = createTransporter();
  const orderLine = data.orderNumber
    ? `<p><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</p>`
    : "";

  await t.sendMail({
    from: `"NaijaMart Contact Form" <${FROM_ADDRESS}>`,
    // Send to the support inbox
    to: FROM_ADDRESS,
    replyTo: `"${sanitizeHeader(data.name)}" <${data.email}>`,
    subject: sanitizeHeader(`[Contact] ${data.subject}`),
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;color:#1a1a1a;">
          <h2 style="color:#174A45;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
          ${orderLine}
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <hr style="border:none;border-top:1px solid #E4E0D8;margin:12px 0;" />
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p>
        </body>
      </html>
    `,
  });
}