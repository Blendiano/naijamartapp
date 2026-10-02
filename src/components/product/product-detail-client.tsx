"use client";

import { useState } from "react";
import Image from "next/image";
import { Shirt, CircleX } from "lucide-react";
import { formatNaira } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  priceModifier: number;
  quantity: number;
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
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images[0]?.url ?? ""
  );
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants[0] ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const currentPrice = selectedVariant
    ? selectedVariant.totalPrice
    : product.basePrice;

  const isOutOfStock = selectedVariant
    ? selectedVariant.quantity <= 0
    : product.variants.length > 0 && product.variants.every((v) => v.quantity <= 0);

  // Group unique sizes and colors
  const sizes = Array.from(
    new Set(product.variants.map((v) => v.size).filter(Boolean))
  ) as string[];
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean))
  ) as string[];

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    const match = product.variants.find(
      (v) => v.size === size && (selectedColor ? v.color === selectedColor : true)
    );
    if (match) setSelectedVariant(match);
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    const match = product.variants.find(
      (v) => (selectedSize ? v.size === selectedSize : true) && v.color === color
    );
    if (match) setSelectedVariant(match);
  }

  async function handleAddToCart() {
    if (!selectedVariant && product.variants.length > 0) {
      toast.error("Please select a variant (size/color)");
      return;
    }

    setIsAdding(true);
    try {
      const variantId = selectedVariant?.id ?? product.variants[0]?.id;
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to add item to cart");
      }

      toast.success(`Added ${product.name} to cart!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding to cart";
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      {/* Gallery */}
      <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px] pb-2 sm:pb-0">
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img.url)}
                className={`relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${
                  selectedImage === img.url ? "border-primary" : "border-border opacity-70"
                }`}
                aria-label="Select image thumbnail"
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? product.name}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Display */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-muted flex-1">
          {selectedImage ? (
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-muted-foreground/60"
              aria-hidden="true"
            >
              <Shirt className="h-16 w-16" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Product Details & Actions */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div>
          {product.category && (
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary">
              {product.category.name}
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            {product.name}
          </h1>
          <p className="text-2xl font-bold mt-3 text-primary">
            {formatNaira(currentPrice)}
          </p>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Variants Selection */}
        {sizes.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Size
            </span>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSizeSelect(s)}
                  className={`h-10 min-w-10 px-3.5 rounded-lg border text-xs font-semibold transition-all ${
                    selectedSize === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-foreground hover:border-primary/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorSelect(c)}
                  className={`h-10 px-4 rounded-lg border text-xs font-semibold transition-all ${
                    selectedColor === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-foreground hover:border-primary/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock status indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {isOutOfStock ? (
            <span className="flex items-center gap-1.5 text-destructive">
              <CircleX className="h-3.5 w-3.5" /> Currently Out of Stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-success">
              <Check className="h-3.5 w-3.5" /> In Stock & Ready to Ship
            </span>
          )}
        </div>

        {/* Quantity & Add to Cart */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center border border-border rounded-lg h-12">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="px-3.5 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="px-3 text-sm font-semibold w-8 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              disabled={isOutOfStock}
              className="px-3.5 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
            className="flex-1 h-12 rounded-xl text-sm font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding
              ? "Adding..."
              : isOutOfStock
              ? "Out of Stock"
              : "Add to Cart"}
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <span>Fast Nationwide Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Paystack Secure Payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}