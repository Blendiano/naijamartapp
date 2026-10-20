/**
 * Pure helpers for product variant selection.
 *
 * A product may expose a size dimension, a colour dimension, both, or neither.
 * These helpers keep that logic out of the presentation layer so it can be
 * unit-tested and reused by any variant selector.
 *
 * A selection value of `null` means "this dimension does not exist on the
 * product", while an empty string is never used as a selection value.
 */

export interface ProductVariantOption {
  id: string;
  size: string | null;
  color: string | null;
  quantity: number;
}

export interface VariantSelection {
  size: string | null;
  color: string | null;
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Unique, non-empty sizes in the order they appear on the variants.
 */
export function getUniqueSizes(
  variants: ProductVariantOption[]
): string[] {
  return Array.from(
    new Set(
      variants
        .map((variant) => variant.size)
        .filter((size): size is string => hasValue(size))
    )
  );
}

/**
 * Unique, non-empty colours in the order they appear on the variants.
 */
export function getUniqueColors(
  variants: ProductVariantOption[]
): string[] {
  return Array.from(
    new Set(
      variants
        .map((variant) => variant.color)
        .filter((color): color is string => hasValue(color))
    )
  );
}

/**
 * Find the variant matching a selection.
 *
 * Pass `null` for a dimension that the product does not define so it is
 * ignored during matching.
 */
export function findVariant<T extends ProductVariantOption>(
  variants: T[],
  size: string | null,
  color: string | null
): T | null {
  return (
    variants.find(
      (variant) =>
        (size === null || variant.size === size) &&
        (color === null || variant.color === color)
    ) ?? null
  );
}

export function isVariantInStock(
  variant: ProductVariantOption | null
): boolean {
  return variant !== null && variant.quantity > 0;
}

/**
 * A size can be selected when at least one variant with that size is in stock,
 * regardless of colour, so the selector can offer every purchasable size.
 */
export function isSizeAvailable(
  variants: ProductVariantOption[],
  size: string
): boolean {
  return variants.some(
    (variant) => variant.size === size && variant.quantity > 0
  );
}

/**
 * A colour can be selected when at least one variant with that colour is in
 * stock, regardless of size.
 */
export function isColorAvailable(
  variants: ProductVariantOption[],
  color: string
): boolean {
  return variants.some(
    (variant) => variant.color === color && variant.quantity > 0
  );
}

/**
 * Preferred colour for a size: an in-stock one when possible, otherwise the
 * first colour defined for that size. Returns `null` when the size has no
 * variants or the product has no colour dimension.
 */
export function pickPreferredColor(
  variants: ProductVariantOption[],
  size: string
): string | null {
  const forSize = variants.filter((variant) => variant.size === size);
  const preferred =
    forSize.find((variant) => variant.quantity > 0) ?? forSize[0];
  const color = preferred?.color ?? null;
  return hasValue(color) ? color : null;
}

/**
 * Preferred size for a colour: an in-stock one when possible, otherwise the
 * first size defined for that colour.
 */
export function pickPreferredSize(
  variants: ProductVariantOption[],
  color: string
): string | null {
  const forColor = variants.filter((variant) => variant.color === color);
  const preferred =
    forColor.find((variant) => variant.quantity > 0) ?? forColor[0];
  const size = preferred?.size ?? null;
  return hasValue(size) ? size : null;
}

/**
 * Initial selection for a product: the first in-stock variant when one exists,
 * otherwise the first variant.
 */
export function getInitialSelection(
  variants: ProductVariantOption[]
): VariantSelection {
  const preferred =
    variants.find((variant) => variant.quantity > 0) ?? variants[0];
  const size = preferred?.size ?? null;
  const color = preferred?.color ?? null;
  return {
    size: hasValue(size) ? size : null,
    color: hasValue(color) ? color : null,
  };
}
