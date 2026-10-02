import { db } from "@/db";
import {
  carts,
  cartItems,
  productVariants,
  products,
  productImages,
  inventory,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateSubtotal } from "@/lib/utils/money";

export interface CartItemWithDetails {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  unitPrice: number; // kobo
  subtotal: number; // kobo
  imageUrl: string | null;
  availableStock: number;
}

/**
 * Get an existing cart or create a new one for user or guest session
 */
export async function getOrCreateCart(
  userId?: string,
  sessionId?: string
): Promise<string> {
  if (userId) {
    const [existing] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (existing) return existing.id;

    const [created] = await db
      .insert(carts)
      .values({ userId })
      .returning({ id: carts.id });

    return created.id;
  }

  if (sessionId) {
    const [existing] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);

    if (existing) return existing.id;

    const [created] = await db
      .insert(carts)
      .values({ sessionId })
      .returning({ id: carts.id });

    return created.id;
  }

  // Create guest cart with no session (will return new cart)
  const [created] = await db.insert(carts).values({}).returning({ id: carts.id });
  return created.id;
}

/**
 * Get the number of items in a cart without creating a cart.
 * Returns 0 when no cart exists yet.
 */
async function sumCartQuantity(cartId: string) {
  const [countRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)`,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return countRow?.total ?? 0;
}

export async function getCartCount(userId?: string, sessionId?: string) {
  if (userId) {
    const [existing] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    if (existing) return sumCartQuantity(existing.id);
  }

  if (sessionId) {
    const [existing] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);
    if (existing) return sumCartQuantity(existing.id);
  }

  return 0;
}

/**
 * Get all items in a cart with full product/variant info and stock
 */
export async function getCartWithItems(cartId: string) {
  const items = await db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      productName: products.name,
      productSlug: products.slug,
      basePrice: products.basePrice,
      priceModifier: productVariants.priceModifier,
      size: productVariants.size,
      color: productVariants.color,
      sku: productVariants.sku,
      productId: products.id,
      availableStock: inventory.quantity,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(eq(cartItems.cartId, cartId));

  // Fetch primary images
  const productIds = items.map((i) => i.productId);
  const imagesMap = new Map<string, string>();

  if (productIds.length > 0) {
    const images = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
      })
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`);

    for (const img of images) {
      if (!imagesMap.has(img.productId)) {
        imagesMap.set(img.productId, img.url);
      }
    }
  }

  const detailedItems: CartItemWithDetails[] = items.map((item) => {
    const unitPrice = item.basePrice + item.priceModifier;
    return {
      id: item.id,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.productName,
      productSlug: item.productSlug,
      size: item.size,
      color: item.color,
      sku: item.sku,
      unitPrice,
      subtotal: unitPrice * item.quantity,
      imageUrl: imagesMap.get(item.productId) ?? null,
      availableStock: item.availableStock ?? 0,
    };
  });

  const subtotal = calculateSubtotal(detailedItems);

  return {
    cartId,
    items: detailedItems,
    itemCount: detailedItems.reduce((acc, i) => acc + i.quantity, 0),
    subtotal,
  };
}

/**
 * Add item to cart or increment quantity if already present
 */
export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
) {
  // Validate variant existence & stock
  const [variant] = await db
    .select({
      id: productVariants.id,
      stock: inventory.quantity,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    throw new Error("Product variant not found");
  }

  const available = variant.stock ?? 0;
  if (available < quantity) {
    throw new Error(`Only ${available} item(s) available in stock`);
  }

  // Check if item already in cart
  const [existing] = await db
    .select({ id: cartItems.id, currentQty: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .limit(1);

  if (existing) {
    const newQty = existing.currentQty + quantity;
    if (newQty > available) {
      throw new Error(`Cannot add ${quantity} more. Stock limit is ${available}`);
    }
    return db
      .update(cartItems)
      .set({ quantity: newQty, updatedAt: new Date() })
      .where(eq(cartItems.id, existing.id));
  }

  return db.insert(cartItems).values({
    cartId,
    variantId,
    quantity,
  });
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
) {
  if (quantity <= 0) {
    return db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  }

  return db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(cartItems.id, cartItemId));
}

/**
 * Remove an item from cart
 */
export async function removeCartItem(cartItemId: string) {
  return db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}
