/**
 * Financial utility helpers.
 * All monetary values in NaijaMart are integer kobo (NGN minor units).
 * 1 NGN = 100 kobo.  Never use floating-point for money.
 */

/**
 * Format kobo to a human-readable NGN string with comma separator.
 * e.g. 2500000 → "₦25,000"
 */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Convert NGN whole units to kobo.
 * e.g. 25000 → 2500000
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Calculate order subtotal from items.
 * unitPrice and quantity are both integers; result is kobo.
 */
export function calculateSubtotal(
  items: Array<{ unitPrice: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/**
 * Calculate order total.
 */
export function calculateTotal(subtotal: number, deliveryFee: number): number {
  return subtotal + deliveryFee;
}
