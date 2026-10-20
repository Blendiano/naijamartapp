"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  WISHLIST_EVENT,
  WISHLIST_STORAGE_KEY,
  parseWishlist,
  removeWishlistItem,
  toggleWishlistItem,
  type WishlistItem,
} from "@/lib/wishlist";

const EMPTY: WishlistItem[] = [];

let cachedRaw: string | null = null;
let cachedItems: WishlistItem[] = EMPTY;

function subscribe(onChange: () => void) {
  window.addEventListener(WISHLIST_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): WishlistItem[] {
  const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedItems = parseWishlist(raw);
  }

  return cachedItems;
}

function getServerSnapshot(): WishlistItem[] {
  return EMPTY;
}

const noopSubscribe = () => () => {};

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

  const toggle = useCallback((item: WishlistItem) => {
    toggleWishlistItem(item);
  }, []);

  const remove = useCallback((id: string) => {
    removeWishlistItem(id);
  }, []);

  const isWishlisted = useCallback(
    (id: string) => items.some((entry) => entry.id === id),
    [items]
  );

  return { items, isReady, toggle, remove, isWishlisted };
}
