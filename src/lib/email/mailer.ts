import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logError } from "@/lib/utils/error-log";
import { getConfiguredAppUrl } from "@/lib/utils/app-url";

/**
 * Nodemailer + SMTP integration.
 *
 * Rules that this module enforces (AGENTS.md §17, §24 and
 * `.agent/Rules/security.md` §24):
 *
 * - SMTP credentials are read from the environment and never leave the server.
 * - A delivery failure is reported to the caller instead of being swallowed,
 *   so a caller can tell the customer that no email was sent. Silently
 *   "succeeding" is what made a broken verification flow look healthy.
 * - The transport is created once and reused: building a new transporter for
 *   every message means a fresh TCP + TLS + AUTH handshake for each email,
 *   which is slow and fails more often.
 * - Nothing about the message payload is logged: the bodies contain live
 *   verification and reset links.
 */

/** Outcome of a single delivery attempt. */
export interface MailDeliveryResult {
  /** True when the SMTP server accepted the message. */
  delivered: boolean;
  /** The SMTP message id, when the message was accepted. */
  messageId?: string;
  /** Plain-language reason, safe to show to a customer. */
  reason?: string;
}

const DELIVERY_FAILURE_REASON =
  "We could not send the email right now. Please try again in a few minutes.";

/* ── Transport ─────────────────────────────────────────────────────────── */

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

function readSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP credentials");
  }
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid SMTP_PORT");
  }

  return { host, port, user, pass };
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const { host, port, user, pass } = readSmtpConfig();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // A slow or unreachable SMTP server must not hold a request open
    // indefinitely: without these, a route handler can hang until the
    // platform kills it, and the customer never gets a response.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  return cachedTransporter;
}

/** Test helper: drops the cached transport so new credentials are picked up. */
export function resetMailTransport(): void {
  cachedTransporter = null;
}

/**
 * Checks that the SMTP server is reachable and that the credentials are
 * accepted. Used by the mail smoke test.
 */
export async function verifySmtpConnection(): Promise<MailDeliveryResult> {
  try {
    await getTransporter().verify();
    return { delivered: true };
  } catch (error) {
    logError("[Email] SMTP verification failed", error);
    return { delivered: false, reason: DELIVERY_FAILURE_REASON };
  }
}

/* ── Sender address ────────────────────────────────────────────────────── */

function isGoogleMailHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return (
    normalized === "smtp.gmail.com" || normalized === "smtp.googlemail.com"
  );
}

function addressLocalPart(address: string): string {
  return (address.split("@")[0] ?? "").trim().toLowerCase();
}

/**
 * Resolves the envelope sender address.
 *
 * Google rejects any message whose `From:` address is not the authenticated
 * account (or a configured send-as alias) with `553 5.7.1 From address not
 * owned`. A misconfigured `EMAIL_FROM` therefore breaks *every* email while
 * the application happily reports success. When the SMTP account is a Google
 * account the authenticated address is used, and the mismatch is logged
 * loudly rather than silently producing undeliverable mail.
 */
export function resolveFromAddress(config: SmtpConfig): string {
  const configured = (process.env.EMAIL_FROM ?? "").trim();
  const user = config.user.trim();

  if (!configured) return user;

  if (isGoogleMailHost(config.host)) {
    const sameAccount =
      addressLocalPart(configured) === addressLocalPart(user) &&
      configured.split("@")[1]?.trim().toLowerCase() ===
        user.split("@")[1]?.trim().toLowerCase();

    if (!sameAccount) {
      logError(
        "[Email] EMAIL_FROM does not match the authenticated SMTP account; using the authenticated address",
        `EMAIL_FROM was set to an address that is not the authenticated Google account, so Google would reject the message.`
      );
      return user;
    }
  }

  return configured;
}

/* ── Escaping helpers ──────────────────────────────────────────────────── */

/**
 * User-supplied values are interpolated into HTML bodies. Escaping prevents
 * injected markup from rendering (or smuggling headers/links) in emails.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Strips CR/LF so user input cannot inject additional mail headers. */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

/* ── Template shell ────────────────────────────────────────────────────── */

const BRAND = {
  primary: "#184945",
  onPrimary: "#ffffff",
  surface: "#fbf9f4",
  onSurface: "#1a1b18",
  onSurfaceVariant: "#484741",
  outlineVariant: "#cac6be",
  success: "#27865a",
} as const;

interface EmailShellOptions {
  heading: string;
  /** Pre-escaped HTML body. */
  bodyHtml: string;
  /** Call to action link. The URL is escaped for the HTML part. */
  action?: { label: string; url: string };
  /** Small print shown under the body. */
  footnote?: string;
}

/**
 * Wraps email bodies in a single, consistent shell.
 *
 * Styles are inline because most mail clients ignore `<style>` blocks.
 */
function emailShell({
  heading,
  bodyHtml,
  action,
  footnote,
}: EmailShellOptions): string {
  const actionHtml = action
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.onPrimary};text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;">${escapeHtml(action.label)}</a></p>`
    : "";

  const footnoteHtml = footnote
    ? `<p style="margin:24px 0 0;color:${BRAND.onSurfaceVariant};font-size:13px;line-height:1.5;">${escapeHtml(footnote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BRAND.surface};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.outlineVariant};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND.primary};padding:20px 28px;">
                <p style="margin:0;color:${BRAND.onPrimary};font-size:18px;font-weight:800;letter-spacing:-0.01em;">NaijaMart</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:${BRAND.onSurface};font-size:15px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:${BRAND.onSurface};">${escapeHtml(heading)}</h1>
                ${bodyHtml}
                ${actionHtml}
                ${footnoteHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${BRAND.outlineVariant};color:${BRAND.onSurfaceVariant};font-size:12px;line-height:1.5;">
                <p style="margin:0;">NaijaMart &middot; Nigerian Fashion, Elevated.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* ── Delivery ──────────────────────────────────────────────────────────── */

interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function deliver(message: MailMessage): Promise<MailDeliveryResult> {
  try {
    const config = readSmtpConfig();
    const fromAddress = resolveFromAddress(config);
    const info = await getTransporter().sendMail({
      from: `"NaijaMart" <${fromAddress}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });

    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    // Never log the message payload: the body contains live links.
    logError("[Email] Delivery failed", error);
    return { delivered: false, reason: DELIVERY_FAILURE_REASON };
  }
}

/* ── Messages ──────────────────────────────────────────────────────────── */

export interface WelcomeEmailData {
  to: string;
  name: string;
  /** Public origin used for the shop link. */
  appUrl?: string;
}

export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<MailDeliveryResult> {
  const name = data.name?.trim() || "there";
  const shopUrl = `${(data.appUrl ?? getConfiguredAppUrl()).replace(/\/+$/, "")}/products`;

  return deliver({
    to: data.to,
    subject: sanitizeHeader(`Welcome to NaijaMart, ${name}!`),
    html: emailShell({
      heading: `Welcome to NaijaMart, ${name}!`,
      bodyHtml: `<p style="margin:0 0 12px;">Your account is ready. We are glad to have you here.</p><p style="margin:0;">Start exploring the latest arrivals and shop Nigerian fashion, elevated.</p>`,
      action: { label: "Start shopping", url: shopUrl },
      footnote: "Check your inbox for a separate email with your verification link.",
    }),
    text: `Hi ${name},\n\nWelcome to NaijaMart. Your account is ready.\n\nStart shopping: ${shopUrl}\n\nCheck your inbox for a separate email with your verification link.\n\nThe NaijaMart Team`,
  });
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetLink: string;
}

export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<MailDeliveryResult> {
  const name = data.name?.trim() || "Customer";

  return deliver({
    to: data.to,
    subject: "Reset your NaijaMart password",
    html: emailShell({
      heading: "Reset your password",
      bodyHtml: `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 12px;">We received a request to reset your NaijaMart password. Use the button below to choose a new one.</p><p style="margin:0;">This link can be used once and expires in 1 hour.</p>`,
      action: { label: "Reset my password", url: data.resetLink },
      footnote: "If you did not request a password reset, you can safely ignore this email — your password will not change.",
    }),
    text: `Hi ${name},\n\nWe received a request to reset your NaijaMart password.\n\nReset your password: ${data.resetLink}\n\nThis link can be used once and expires in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email.`,
  });
}

export interface VerificationEmailData {
  to: string;
  name: string;
  verifyLink: string;
  /** How long the link stays valid, in minutes. */
  expiresInMinutes: number;
}

export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<MailDeliveryResult> {
  const name = data.name?.trim() || "there";

  return deliver({
    to: data.to,
    subject: sanitizeHeader(`Verify your email address — NaijaMart`),
    html: emailShell({
      heading: "Verify your email address",
      bodyHtml: `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p><p style="margin:0 0 12px;">Welcome to NaijaMart! Please confirm your email address to finish setting up your account.</p><p style="margin:0;">You can open this link on any device — phone, tablet or computer.</p>`,
      action: { label: "Verify my email", url: data.verifyLink },
      footnote: `This verification link expires ${data.expiresInMinutes} minutes after it was sent. If you did not create a NaijaMart account, you can safely ignore this email.`,
    }),
    text: `Hi ${name},\n\nWelcome to NaijaMart! Please confirm your email address to finish setting up your account.\n\nVerify your email: ${data.verifyLink}\n\nThis verification link expires ${data.expiresInMinutes} minutes after it was sent.\n\nIf you did not create a NaijaMart account, you can safely ignore this email.`,
  });
}

export interface OrderConfirmationEmailData {
  to: string;
  name: string;
  orderNumber: string;
  amount: string;
  orderLink: string;
}

export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData
): Promise<MailDeliveryResult> {
  const name = data.name?.trim() || "Customer";

  return deliver({
    to: data.to,
    subject: sanitizeHeader(`Order confirmation — ${data.orderNumber}`),
    html: emailShell({
      heading: `Thank you for your order, ${name}`,
      bodyHtml: `<p style="margin:0 0 12px;">We have received your order and it is being prepared for delivery.</p><p style="margin:0 0 12px;"><strong>Order number:</strong> ${escapeHtml(data.orderNumber)}</p><p style="margin:0;"><strong>Total:</strong> ${escapeHtml(data.amount)}</p>`,
      action: { label: "View your order", url: data.orderLink },
      footnote: "You will receive another email when your order is on its way.",
    }),
    text: `Hi ${name},\n\nWe have received your order and it is being prepared for delivery.\n\nOrder number: ${data.orderNumber}\nTotal: ${data.amount}\n\nView your order: ${data.orderLink}\n\nYou will receive another email when your order is on its way.`,
  });
}

export interface ContactFormEmailData {
  name: string;
  email: string;
  orderNumber?: string;
  subject: string;
  message: string;
  /** Address the message is delivered to. Defaults to the sender address. */
  recipient?: string;
}

export async function sendContactFormEmail(
  data: ContactFormEmailData
): Promise<MailDeliveryResult> {
  const config = readSmtpConfig();
  const fromAddress = resolveFromAddress(config);
  const recipient = (data.recipient ?? fromAddress).trim();

  const orderLine = data.orderNumber
    ? `<p style="margin:0 0 12px;"><strong>Order Number:</strong> ${escapeHtml(data.orderNumber)}</p>`
    : "";

  return deliver({
    to: recipient,
    subject: sanitizeHeader(`[Contact] ${data.subject}`),
    replyTo: `"${sanitizeHeader(data.name)}" <${data.email}>`,
    html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BRAND.surface};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.outlineVariant};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND.primary};padding:20px 28px;">
                <p style="margin:0;color:${BRAND.onPrimary};font-size:18px;font-weight:800;">NaijaMart</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:${BRAND.onSurface};font-size:15px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;">New contact form submission</h1>
                <p style="margin:0 0 12px;"><strong>Name:</strong> ${escapeHtml(data.name)}</p>
                <p style="margin:0 0 12px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}" style="color:${BRAND.primary};">${escapeHtml(data.email)}</a></p>
                ${orderLine}
                <p style="margin:0 0 12px;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
                <p style="margin:0;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `New contact form submission\n\nName: ${data.name}\nEmail: ${data.email}\n${data.orderNumber ? `Order Number: ${data.orderNumber}\n` : ""}Subject: ${data.subject}\n\n${data.message}`,
  });
}
