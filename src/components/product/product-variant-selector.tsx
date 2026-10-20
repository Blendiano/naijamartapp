import { Palette } from "lucide-react";
import { getColorSwatch } from "@/lib/utils/color-swatches";
import { cn } from "cn";

interface ProductVariantSelectorProps {
  sizes: string[];
  colors: string[];
  selectedSize: string | null;
  selectedColor: string | null;
  isSizeAvailable: (size: string) => boolean;
  isColorAvailable: (color: string) => boolean;
  onSelectSize: (size: string) => void;
  onSelectColor: (color: string) => void;
}

const optionBaseClass =
  "inline-flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed";

export function ProductVariantSelector({
  sizes,
  colors,
  selectedSize,
  selectedColor,
  isSizeAvailable,
  isColorAvailable,
  onSelectSize,
  onSelectColor,
}: ProductVariantSelectorProps) {
  const hasSizes = sizes.length > 0;
  const hasColors = colors.length > 0;

  if (!hasSizes && !hasColors) return null;

  return (
    <div className="flex flex-col gap-6">
      {hasSizes && (
        <div
          role="group"
          aria-labelledby="product-size-label"
          className="flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span
              id="product-size-label"
              className="text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Size
            </span>
            {selectedSize && (
              <span className="text-xs text-muted-foreground">
                {selectedSize}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const selected = selectedSize === size;
              const available = isSizeAvailable(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSelectSize(size)}
                  aria-pressed={selected}
                  disabled={!available}
                  title={available ? undefined : `${size} is out of stock`}
                  className={cn(
                    optionBaseClass,
                    "h-11 min-w-11 px-4 text-sm font-semibold",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                        ? "border-border bg-background text-foreground hover:border-primary/60 hover:bg-muted/50"
                        : "border-border/70 bg-muted/40 text-muted-foreground/60 line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasColors && (
        <div
          role="group"
          aria-labelledby="product-color-label"
          className="flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <span
              id="product-color-label"
              className="text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Color
            </span>
            {selectedColor && (
              <span className="text-xs text-muted-foreground">
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((color) => {
              const selected = selectedColor === color;
              const available = isColorAvailable(color);
              const swatch = getColorSwatch(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  aria-pressed={selected}
                  disabled={!available}
                  title={available ? undefined : `${color} is out of stock`}
                  className={cn(
                    optionBaseClass,
                    "h-11 gap-2 px-3.5 text-sm font-medium",
                    selected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : available
                        ? "border-border bg-background text-foreground hover:border-primary/60 hover:bg-muted/50"
                        : "border-border/70 bg-muted/40 text-muted-foreground/60 line-through"
                  )}
                >
                  {swatch.hex ? (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ) : swatch.isMulti ? (
                    <Palette
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                  ) : null}
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
