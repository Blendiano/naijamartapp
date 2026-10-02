import { db } from "@/db";
import {
  products,
  productImages,
  productVariants,
  categories,
  inventory,
} from "@/db/schema";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";

export interface ProductFilterOptions {
  categoryId?: string;
  categorySlug?: string;
  searchQuery?: string;
  minPrice?: number; // kobo
  maxPrice?: number; // kobo
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

// Rich fallback Nigerian fashion catalogue for when Neon DB is not yet populated
const FALLBACK_CATEGORIES = [
  { id: "cat-1", name: "Women's Fashion", slug: "womens-fashion", description: "Elegant Nigerian womenswear" },
  { id: "cat-2", name: "Men's Fashion", slug: "mens-fashion", description: "Tailored Nigerian menswear" },
  { id: "cat-3", name: "Accessories", slug: "accessories", description: "Fashion accessories and caps" },
];

const FALLBACK_PRODUCTS = [
  {
    id: "prod-1",
    slug: "adire-silk-boubou",
    name: "Adire Silk Boubou",
    description: "Handcrafted Premium Nigerian Adire Silk Boubou. Made with 100% pure silk and traditional tie-dye technique.",
    basePrice: 3500000, // ₦35,000 in kobo
    sku: "NJM-ADR-001",
    category: { name: "Women's Fashion", slug: "womens-fashion" },
    primaryImage: {
      url: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80",
      altText: "Adire Silk Boubou",
    },
    images: [
      {
        id: "img-1",
        url: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80",
        altText: "Adire Silk Boubou Front",
        isPrimary: true,
        displayOrder: 0,
      },
    ],
    variants: [
      { id: "var-1", size: "M", color: "Indigo", sku: "NJM-ADR-001-M", priceModifier: 0, quantity: 15, totalPrice: 3500000, isActive: true },
      { id: "var-2", size: "L", color: "Indigo", sku: "NJM-ADR-001-L", priceModifier: 0, quantity: 10, totalPrice: 3500000, isActive: true },
      { id: "var-3", size: "XL", color: "Indigo", sku: "NJM-ADR-001-XL", priceModifier: 0, quantity: 8, totalPrice: 3500000, isActive: true },
    ],
  },
  {
    id: "prod-2",
    slug: "royal-velvet-agbada",
    name: "Royal Velvet Agbada Set",
    description: "3-Piece Premium Embroidered Velvet Agbada Set with matching trousers and Fila cap.",
    basePrice: 7500000, // ₦75,000 in kobo
    sku: "NJM-AGB-002",
    category: { name: "Men's Fashion", slug: "mens-fashion" },
    primaryImage: {
      url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
      altText: "Royal Velvet Agbada Set",
    },
    images: [
      {
        id: "img-2",
        url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80",
        altText: "Royal Velvet Agbada Front",
        isPrimary: true,
        displayOrder: 0,
      },
    ],
    variants: [
      { id: "var-4", size: "L", color: "Emerald Green", sku: "NJM-AGB-002-L", priceModifier: 0, quantity: 12, totalPrice: 7500000, isActive: true },
      { id: "var-5", size: "XL", color: "Emerald Green", sku: "NJM-AGB-002-XL", priceModifier: 0, quantity: 5, totalPrice: 7500000, isActive: true },
    ],
  },
  {
    id: "prod-3",
    slug: "ankara-maxi-gown",
    name: "Ankara Mermaid Maxi Gown",
    description: "Vibrant custom-fit African print maxi dress with sweetheart neck and side slit.",
    basePrice: 2800000, // ₦28,000 in kobo
    sku: "NJM-ANK-003",
    category: { name: "Women's Fashion", slug: "womens-fashion" },
    primaryImage: {
      url: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
      altText: "Ankara Mermaid Maxi Gown",
    },
    images: [
      {
        id: "img-3",
        url: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80",
        altText: "Ankara Maxi Gown",
        isPrimary: true,
        displayOrder: 0,
      },
    ],
    variants: [
      { id: "var-6", size: "S", color: "Yellow/Blue Print", sku: "NJM-ANK-003-S", priceModifier: 0, quantity: 20, totalPrice: 2800000, isActive: true },
      { id: "var-7", size: "M", color: "Yellow/Blue Print", sku: "NJM-ANK-003-M", priceModifier: 0, quantity: 18, totalPrice: 2800000, isActive: true },
    ],
  },
  {
    id: "prod-4",
    slug: "senator-tailored-suit",
    name: "Tailored Senator Fit Suit",
    description: "Modern minimalist 2-piece Senator wear crafted from premium cashmere blend fabric.",
    basePrice: 4200000, // ₦42,000 in kobo
    sku: "NJM-SEN-004",
    category: { name: "Men's Fashion", slug: "mens-fashion" },
    primaryImage: {
      url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      altText: "Tailored Senator Fit Suit",
    },
    images: [
      {
        id: "img-4",
        url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        altText: "Senator Fit Suit",
        isPrimary: true,
        displayOrder: 0,
      },
    ],
    variants: [
      { id: "var-8", size: "M", color: "Navy Blue", sku: "NJM-SEN-004-M", priceModifier: 0, quantity: 14, totalPrice: 4200000, isActive: true },
      { id: "var-9", size: "L", color: "Navy Blue", sku: "NJM-SEN-004-L", priceModifier: 0, quantity: 9, totalPrice: 4200000, isActive: true },
    ],
  },
];

/**
 * Get active products with primary image and category
 */
export async function getProducts(options: ProductFilterOptions = {}) {
  const { categorySlug, searchQuery, limit = 20, offset = 0 } = options;

  try {
    let categoryId: string | undefined;

    if (categorySlug) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (!cat) return getFallbackProducts(options);
      categoryId = cat.id;
    }

    const conditions = [eq(products.isActive, true)];

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const term = `%${searchQuery.trim()}%`;
      conditions.push(
        or(ilike(products.name, term), ilike(products.description, term))!
      );
    }

    const rawProducts = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        basePrice: products.basePrice,
        sku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    if (rawProducts.length === 0) {
      return getFallbackProducts(options);
    }

    // Fetch primary images for these products
    const productIds = rawProducts.map((p) => p.id);
    const imagesMap = new Map<string, { url: string; altText: string | null }>();

    if (productIds.length > 0) {
      const images = await db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          altText: productImages.altText,
          isPrimary: productImages.isPrimary,
        })
        .from(productImages)
        .where(sql`${productImages.productId} IN ${productIds}`);

      for (const img of images) {
        if (img.isPrimary || !imagesMap.has(img.productId)) {
          imagesMap.set(img.productId, { url: img.url, altText: img.altText });
        }
      }
    }

    return rawProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      basePrice: p.basePrice,
      sku: p.sku,
      category: p.categoryName
        ? { name: p.categoryName, slug: p.categorySlug }
        : null,
      primaryImage: imagesMap.get(p.id) ?? null,
    }));
  } catch (error) {
    console.warn("Database query failed; returning fallback products:", error);
    return getFallbackProducts(options);
  }
}

function getFallbackProducts(options: ProductFilterOptions) {
  let list = [...FALLBACK_PRODUCTS];

  if (options.categorySlug) {
    list = list.filter((p) => p.category.slug === options.categorySlug);
  }

  if (options.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  return list.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 20));
}

/**
 * Get product detail by slug with all images, variants, and stock
 */
export async function getProductBySlug(slug: string) {
  try {
    const [product] = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        description: products.description,
        basePrice: products.basePrice,
        sku: products.sku,
        isActive: products.isActive,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
    }

    // Images
    const images = await db
      .select({
        id: productImages.id,
        url: productImages.url,
        altText: productImages.altText,
        isPrimary: productImages.isPrimary,
        displayOrder: productImages.displayOrder,
      })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(desc(productImages.isPrimary), productImages.displayOrder);

    // Variants with inventory
    const variants = await db
      .select({
        id: productVariants.id,
        size: productVariants.size,
        color: productVariants.color,
        sku: productVariants.sku,
        priceModifier: productVariants.priceModifier,
        isActive: productVariants.isActive,
        quantity: inventory.quantity,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
      .where(
        and(
          eq(productVariants.productId, product.id),
          eq(productVariants.isActive, true)
        )
      );

    return {
      ...product,
      category: product.categoryName
        ? { name: product.categoryName, slug: product.categorySlug }
        : null,
      images,
      variants: variants.map((v) => ({
        ...v,
        quantity: v.quantity ?? 0,
        totalPrice: product.basePrice + v.priceModifier,
      })),
    };
  } catch (error) {
    console.warn("Database query for product slug failed; using fallback:", error);
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

/**
 * Get all active categories
 */
export async function getCategories() {
  try {
    const list = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.name);

    if (list.length > 0) return list;
    return FALLBACK_CATEGORIES;
  } catch (error) {
    console.warn("Database query for categories failed; using fallback:", error);
    return FALLBACK_CATEGORIES;
  }
}
