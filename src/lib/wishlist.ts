export const WISHLIST_STORAGE_KEY = "naijamart:wishlist";

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryName: string | null;
}

export const WISHLIST_EVENT = "naijamart:wishlist-change";

function isValidItem(value: unknown): value is WishlistItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.slug === "string";
}

export function readWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidItem);
  } catch {
    return [];
  }
}

export function writeWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode / quota) — wishlist stays in-memory only.
  }

  window.dispatchEvent(new Event(WISHLIST_EVENT));
}

export function toggleWishlistItem(item: WishlistItem): WishlistItem[] {
  const items = readWishlist();
  const exists = items.some((entry) => entry.id === item.id);

  const next = exists
    ? items.filter((entry) => entry.id !== item.id)
    : [item, ...items];

  writeWishlist(next);
  return next;
}

export function removeWishlistItem(id: string): WishlistItem[] {
  const next = readWishlist().filter((entry) => entry.id !== id);
  writeWishlist(next);
  return next;
}
