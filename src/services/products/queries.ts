import { db } from "@/db";
import {
  products,
  productImages,
  productVariants,
  categories,
  inventory,
} from "@/db/schema";
import { eq, and, ilike, or, desc, inArray } from "drizzle-orm";
import {
  ProductFilterOptions,
  ProductImage,
  ProductVariant,
  ProductWithDetails,
} from "./types";

export async function getCategoriesFromDB() {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
    })
    .from(categories)
    .orderBy(categories.name);
}

/**
 * Batch-load images, variants, inventory and category info for a set of
 * product rows. Replaces the previous per-product query loop (N+1) with a
 * fixed number of batched queries, and gives the list and detail paths a
 * single shared mapping so they cannot drift apart.
 */
async function hydrateProducts(
  productRows: Array<typeof products.$inferSelect>,
  options: { inStockOnly?: boolean } = {}
): Promise<ProductWithDetails[]> {
  if (productRows.length === 0) return [];

  const productIds = productRows.map((p) => p.id);

  const [imageRows, variantRows, categoryRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(productImages.displayOrder),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds)),
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories),
  ]);

  const inventoryRows =
    variantRows.length > 0
      ? await db
          .select({
            variantId: inventory.variantId,
            quantity: inventory.quantity,
          })
          .from(inventory)
          .where(
            inArray(
              inventory.variantId,
              variantRows.map((v) => v.id)
            )
          )
      : [];

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const img of imageRows) {
    const list = imagesByProduct.get(img.productId) ?? [];
    list.push({
      id: img.id,
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary ?? false,
      displayOrder: img.displayOrder ?? 0,
    });
    imagesByProduct.set(img.productId, list);
  }

  const variantsByProduct = new Map<string, typeof variantRows>();
  for (const v of variantRows) {
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }

  const quantityByVariant = new Map(
    inventoryRows.map((inv) => [inv.variantId, inv.quantity])
  );

  const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));

  const result: ProductWithDetails[] = [];

  for (const p of productRows) {
    const allImages = imagesByProduct.get(p.id) ?? [];
    const primaryImage =
      allImages.find((img) => img.isPrimary) ?? allImages[0] ?? null;

    const variantList: ProductVariant[] = [];
    for (const v of variantsByProduct.get(p.id) ?? []) {
      const quantity = quantityByVariant.get(v.id) ?? 0;
      if (options.inStockOnly && quantity <= 0) continue;

      variantList.push({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        priceModifier: v.priceModifier,
        quantity,
        totalPrice: p.basePrice + v.priceModifier,
        isActive: v.isActive,
      });
    }

    // "In stock only" means purchasable: a product whose variants are all
    // out of stock must not appear in the listing.
    if (options.inStockOnly && variantList.length === 0) continue;

    const cat = p.categoryId ? categoryMap.get(p.categoryId) ?? null : null;

    result.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      sku: p.sku,
      isActive: p.isActive,
      category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
      primaryImage,
      images: allImages,
      variants: variantList,
    });
  }

  return result;
}

export async function getProductsFromDB(
  filters: ProductFilterOptions = {}
): Promise<ProductWithDetails[]> {
  const {
    categoryId,
    categorySlug,
    searchQuery,
    inStockOnly,
    limit = 100,
    offset = 0,
  } = filters;

  const conditions = [eq(products.isActive, true)];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  if (categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    // An unknown category must yield no products — silently dropping the
    // filter would return the entire catalogue instead.
    if (!cat) return [];
    conditions.push(eq(products.categoryId, cat.id));
  }

  if (searchQuery && searchQuery.trim()) {
    const q = `%${searchQuery.trim()}%`;
    conditions.push(or(ilike(products.name, q), ilike(products.description, q))!);
  }

  const productRows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return hydrateProducts(productRows, { inStockOnly });
}

export async function getProductBySlugFromDB(
  slug: string
): Promise<ProductWithDetails | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!product) return null;

  const [hydrated] = await hydrateProducts([product]);
  return hydrated ?? null;
}
