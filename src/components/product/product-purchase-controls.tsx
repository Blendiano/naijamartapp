import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductPurchaseControlsProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  isAdding: boolean;
  isOutOfStock: boolean;
}

const stepperButtonClass =
  "flex h-full w-12 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent";

export function ProductPurchaseControls({
  quantity,
  maxQuantity,
  onQuantityChange,
  onAddToCart,
  isAdding,
  isOutOfStock,
}: ProductPurchaseControlsProps) {
  const canDecrease = quantity > 1 && !isOutOfStock;
  const canIncrease = !isOutOfStock && quantity < maxQuantity;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="flex h-14 w-36 items-center justify-center gap-1 overflow-hidden rounded-xl border border-border bg-background">
        <button
          type="button"
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={!canDecrease}
          aria-label="Decrease quantity"
          className={stepperButtonClass}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="min-w-8 text-center text-base font-semibold tabular-nums"
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={!canIncrease}
          aria-label="Increase quantity"
          className={stepperButtonClass}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onAddToCart}
        loading={isAdding}
        disabled={isOutOfStock}
        className="flex-1 gap-2"
      >
        {!isAdding && !isOutOfStock && (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
        {isAdding ? "Adding…" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
