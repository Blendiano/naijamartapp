"use client";

import { useMemo, useState } from "react";
import { Check, CircleX, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { formatNaira } from "@/lib/utils/money";
import {
  findVariant,
  getInitialSelection,
  getUniqueColors,
  getUniqueSizes,
  isColorAvailable,
  isSizeAvailable,
  isVariantInStock,
  pickPreferredColor,
  pickPreferredSize,
  type ProductVariantOption,
} from "@/lib/utils/product-variants";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";
import { ProductPurchaseControls } from "@/components/product/product-purchase-controls";

interface Variant extends ProductVariantOption {
  sku: string | null;
  priceModifier: number;
  totalPrice: number;
}

interface ImageItem {
  id: string;
  url: string;
  altText: string | null;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    basePrice: number;
    category?: { name: string; slug: string | null } | null;
    images: ImageItem[];
    variants: Variant[];
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const variants = product.variants;

  const sizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const colors = useMemo(() => getUniqueColors(variants), [variants]);
  const initialSelection = useMemo(
    () => getInitialSelection(variants),
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(
    initialSelection.size
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialSelection.color
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = useMemo(
    () => findVariant(variants, selectedSize, selectedColor),
    [variants, selectedSize, selectedColor]
  );

  const currentPrice = selectedVariant?.totalPrice ?? product.basePrice;
  const availableQuantity = selectedVariant?.quantity ?? 0;
  const isOutOfStock = !isVariantInStock(selectedVariant);

  function handleSelectSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);

    // Keep a valid combination: if the current colour has no stock in the new
    // size, move to an in-stock colour for that size.
    const colorStillAvailable =
      selectedColor !== null &&
      variants.some(
        (variant) =>
          variant.size === size &&
          variant.color === selectedColor &&
          variant.quantity > 0
      );

    if (!colorStillAvailable) {
      const nextColor = pickPreferredColor(variants, size);
      if (nextColor !== null) setSelectedColor(nextColor);
    }
  }

  function handleSelectColor(color: string) {
    setSelectedColor(color);
    setQuantity(1);

    const sizeStillAvailable =
      selectedSize !== null &&
      variants.some(
        (variant) =>
          variant.color === color &&
          variant.size === selectedSize &&
          variant.quantity > 0
      );

    if (!sizeStillAvailable) {
      const nextSize = pickPreferredSize(variants, color);
      if (nextSize !== null) setSelectedSize(nextSize);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) {
      toast.error("Please select an available size and color.");
      return;
    }

    if (selectedVariant.quantity <= 0) {
      toast.error("This option is currently out of stock.");
      return;
    }

    if (quantity > selectedVariant.quantity) {
      toast.error(
        `Only ${selectedVariant.quantity} item(s) available in stock`
      );
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? "Failed to add item to cart");
      }

      toast.success(`Added ${product.name} to cart!`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error adding to cart";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-12 xl:gap-16">
      <ProductGallery images={product.images} productName={product.name} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
              {product.category.name}
            </span>
          )}
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <p className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
            {formatNaira(currentPrice)}
          </p>
        </div>

        {product.description && (
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
            {product.description}
          </p>
        )}

        <ProductVariantSelector
          sizes={sizes}
          colors={colors}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          isSizeAvailable={(size) => isSizeAvailable(variants, size)}
          isColorAvailable={(color) => isColorAvailable(variants, color)}
          onSelectSize={handleSelectSize}
          onSelectColor={handleSelectColor}
        />

        <div className="flex items-center gap-2 text-sm font-medium">
          {isOutOfStock ? (
            <span className="flex items-center gap-1.5 text-destructive">
              <CircleX className="h-4 w-4" aria-hidden="true" />
              Out of stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-success">
              <Check className="h-4 w-4" aria-hidden="true" />
              In stock
            </span>
          )}
        </div>

        <ProductPurchaseControls
          quantity={quantity}
          maxQuantity={availableQuantity}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
          isOutOfStock={isOutOfStock}
        />

        {/* Delivery & payment information */}
        <div className="mt-2 border-t border-border pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Delivery
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Delivery options and fees are shown at checkout.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Secure payment
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Payments are processed securely by Paystack.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
