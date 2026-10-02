import { customAlphabet } from "nanoid";

// Unambiguous alphanumeric characters (no 0/O, 1/I/l confusion)
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/**
 * Generate a human-readable, unique NaijaMart order number.
 * Format: NJM-YYYYMMDD-XXXXXX
 * e.g.    NJM-20260923-X4K2PQ
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return `NJM-${date}-${nanoid()}`;
}

/**
 * Generate a payment reference for Paystack.
 * Format: NJM-PAY-YYYYMMDD-XXXXXX
 * Only alphanumeric + hyphen — meets Paystack reference requirements.
 */
export function generatePaymentReference(): string {
  const now = new Date();
  const date = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return `NJM-PAY-${date}-${nanoid()}`;
}

/**
 * Generate a product SKU prefix
 */
export function generateSku(productName: string): string {
  const prefix = productName
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
  return `NJM-${prefix || "PRD"}-${nanoid()}`;
}
