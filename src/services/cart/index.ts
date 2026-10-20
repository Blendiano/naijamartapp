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
 * Look up an existing cart for a user, else for a guest session.
 * Returns null when neither identity matches a cart.
 */
async function findCartId(
  userId?: string,
  sessionId?: string
): Promise<string | null> {
  if (userId) {
    const [owned] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
    return owned?.id ?? null;
  }

  if (sessionId) {
    const [bySession] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);
    return bySession?.id ?? null;
  }

  return null;
}

/**
 * Get an existing cart or create a new one for user or guest session
 */
export async function getOrCreateCart(
  userId?: string,
  sessionId?: string
): Promise<string> {
  const existing = await findCartId(userId, sessionId);
  if (existing) return existing;

  const [created] = await db
    .insert(carts)
    .values(userId ? { userId } : sessionId ? { sessionId } : {})
    .returning({ id: carts.id });

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
  const cartId = await findCartId(userId, sessionId);
  return cartId ? sumCartQuantity(cartId) : 0;
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the cart a request is allowed to touch.
 *
 * Authenticated callers are always scoped to their own cart. Guests are scoped
 * to the cart referenced by the `naijamart_session` cookie: the cart API writes
 * the cart id into that cookie, while the cart pages look it up as
 * `carts.sessionId`. Both forms are accepted so that a request can only ever
 * reach a cart whose identifier it already holds.
 *
 * Returns null when the request carries no usable cart identity.
 */
export async function resolveCartId(
  userId?: string,
  sessionId?: string
): Promise<string | null> {
  const found = await findCartId(userId, sessionId);
  if (found) return found;

  if (userId || !sessionId) return null;

  // The cart id is compared against a uuid column, so guard the format first.
  if (!UUID_PATTERN.test(sessionId)) return null;

  const [byId] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.id, sessionId))
    .limit(1);
  return byId?.id ?? null;
}

/**
 * Update cart item quantity, scoped to the caller's cart.
 * Returns false when the item does not belong to that cart.
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
  cartId: string
): Promise<boolean> {
  if (quantity <= 0) {
    return removeCartItem(cartItemId, cartId);
  }

  const updated = await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
    .returning({ id: cartItems.id });

  return updated.length > 0;
}

/**
 * Remove an item from a cart, scoped to the caller's cart.
 * Returns false when the item does not belong to that cart.
 */
export async function removeCartItem(
  cartItemId: string,
  cartId: string
): Promise<boolean> {
  const deleted = await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
    .returning({ id: cartItems.id });

  return deleted.length > 0;
}
