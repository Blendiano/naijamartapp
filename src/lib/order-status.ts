/**
 * Single source of truth for order statuses.
 *
 * The database enum, API validation, service-layer typing and UI labels all
 * derive from this module so that adding or renaming a status is a one-file
 * change. This module is pure TypeScript (no imports) so it is safe to import
 * from both server code and client components.
 */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/** Human-readable label for a status, e.g. "pending" → "Pending". */
export function orderStatusLabel(status: string): string {
  if (isOrderStatus(status)) {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  }
  return status;
}

/**
 * Visual tone for a status. Preserves the existing product decision:
 * only "confirmed" and "delivered" render with the success colour.
 */
export function orderStatusIsSuccess(status: string): boolean {
  return status === "confirmed" || status === "delivered";
}
