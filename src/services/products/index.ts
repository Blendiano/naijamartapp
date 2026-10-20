import {
  getCategoriesFromDB,
  getProductBySlugFromDB,
  getProductsFromDB,
} from "./queries";
import { logError } from "@/lib/utils/error-log";
import {
  ProductFilterOptions,
  ProductImage,
  ProductVariant,
  ProductWithDetails,
} from "./types";

/**
 * Data-access failures are logged (sanitized) and rethrown so the request
 * fails visibly through the app error boundary instead of silently serving
 * fabricated data. An empty database legitimately returns empty results.
 */
export async function getCategories() {
  try {
    return await getCategoriesFromDB();
  } catch (error) {
    logError("products/getCategories", error);
    throw error;
  }
}

export async function getProducts(
  filters: ProductFilterOptions = {}
): Promise<ProductWithDetails[]> {
  try {
    return await getProductsFromDB(filters);
  } catch (error) {
    logError("products/getProducts", error);
    throw error;
  }
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  try {
    return await getProductBySlugFromDB(slug);
  } catch (error) {
    logError("products/getProductBySlug", error);
    throw error;
  }
}

export type {
  ProductFilterOptions,
  ProductImage,
  ProductVariant,
  ProductWithDetails,
};
