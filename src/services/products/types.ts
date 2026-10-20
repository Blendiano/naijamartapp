export interface ProductFilterOptions {
  limit?: number;
  offset?: number;
  categoryId?: string;
  categorySlug?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  priceModifier: number;
  quantity: number;
  /** Unit price in kobo: basePrice + priceModifier */
  totalPrice: number;
  isActive: boolean;
}

export interface ProductWithDetails {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
  sku: string | null;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  primaryImage: ProductImage | null;
  images: ProductImage[];
  variants: ProductVariant[];
}
