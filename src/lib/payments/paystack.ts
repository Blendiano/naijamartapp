import crypto from "node:crypto";

const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystackRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  const json = (await res.json()) as { status: boolean; data: T; message?: string };

  if (!json.status) {
    throw new Error(`Paystack error: ${json.message ?? "Unknown error"}`);
  }

  return json.data;
}

// ── Types ────────────────────────────────────────────────────

export interface InitializeTransactionParams {
  email: string;
  /** Amount in kobo */
  amount: number;
  currency?: string;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTransactionResult {
  reference: string;
  status: string;
  /** Amount in kobo */
  amount: number;
  currency: string;
  paid_at: string | null;
  channel: string;
  customer: { email: string };
}

// ── API functions ─────────────────────────────────────────────

/**
 * Initialize a Paystack transaction.
 * Amount must be in kobo (NGN minor units).
 */
export async function initializeTransaction(
  params: InitializeTransactionParams
): Promise<InitializeTransactionResult> {
  return paystackRequest<InitializeTransactionResult>(
    "POST",
    "/transaction/initialize",
    {
      ...params,
      currency: params.currency ?? "NGN",
      amount: String(params.amount),
    }
  );
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResult> {
  return paystackRequest<VerifyTransactionResult>(
    "GET",
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

/**
 * Verify the x-paystack-signature header using HMAC SHA-512.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const secret = getSecretKey();
  const expected = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
