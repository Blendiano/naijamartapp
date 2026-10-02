"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { formatNaira } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import type { CartItemWithDetails } from "@/services/cart";

interface CartClientProps {
  initialCart: {
    cartId: string;
    items: CartItemWithDetails[];
    itemCount: number;
    subtotal: number;
  };
}

export function CartClient({ initialCart }: CartClientProps) {
  const [items, setItems] = useState<CartItemWithDetails[]>(initialCart.items);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  async function updateQuantity(itemId: string, newQty: number) {
    if (newQty < 1) {
      return removeItem(itemId);
    }

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: newQty, subtotal: i.unitPrice * newQty }
          : i
      )
    );

    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });

      if (!res.ok) {
        throw new Error("Failed to update quantity");
      }
    } catch {
      toast.error("Failed to update item quantity");
      // Revert optimistic update by re-fetching
      window.location.reload();
    }
  }

  async function removeItem(itemId: string) {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove item");
      }
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
      window.location.reload();
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" aria-hidden="true" />}
        title="Your cart is empty"
        description="Explore our latest fashion collections and find something you love."
        action={
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Cart Items List */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
          Shopping Cart ({items.length})
        </h1>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl border border-border bg-card items-center"
            >
              {/* Image */}
              <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-muted-foreground/60"
                    aria-hidden="true"
                  >
                    <Shirt className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-sm font-semibold truncate text-foreground hover:underline"
                >
                  {item.productName}
                </Link>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.size && item.color && <span>•</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>

                <span className="text-sm font-bold mt-1 text-primary">
                  {formatNaira(item.unitPrice)}
                </span>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center border border-border rounded-lg h-9">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="px-2.5 text-xs font-bold hover:text-primary text-muted-foreground"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-2 text-xs font-semibold w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.availableStock}
                  className="px-2.5 text-xs font-bold hover:text-primary text-muted-foreground disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Item Total */}
              <div className="text-right flex flex-col items-end gap-1 min-w-20">
                <span className="text-sm font-bold text-foreground">
                  {formatNaira(item.subtotal)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Remove ${item.productName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary & Checkout CTA */}
      <div className="lg:col-span-4">
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-5 sticky top-24">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Order Summary
          </h2>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatNaira(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-xs text-secondary">
                Calculated at checkout
              </span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between text-base font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatNaira(subtotal)}</span>
            </div>
          </div>

          <Link href="/checkout" className="w-full">
            <Button className="w-full h-12 rounded-xl text-sm font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingBag className="h-4 w-4" />
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}