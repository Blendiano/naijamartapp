import { db } from "@/db";
import { reviews, orders, orderItems } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

/**
 * Get a user's verified order ID for a product
 */
export async function getUserVerifiedOrderForProduct(
  userId: string,
  productId: string
) {
  // Find confirmed/delivered orders for user
  const userOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        inArray(orders.status, ["confirmed", "processing", "shipped", "delivered"])
      )
    );

  if (userOrders.length === 0) return null;

  const orderIds = userOrders.map((o) => o.id);

  const [match] = await db
    .select({ orderId: orderItems.orderId })
    .from(orderItems)
    .where(
      and(
        inArray(orderItems.orderId, orderIds),
        eq(orderItems.productId, productId)
      )
    )
    .limit(1);

  return match?.orderId ?? null;
}

/**
 * Create a product review with verified purchase orderId
 */
export async function createProductReview(
  userId: string,
  productId: string,
  rating: number,
  comment: string
) {
  const verifiedOrderId = await getUserVerifiedOrderForProduct(userId, productId);

  if (!verifiedOrderId) {
    throw new Error(
      "Only customers who have purchased and confirmed this product can leave a review."
    );
  }

  const [review] = await db
    .insert(reviews)
    .values({
      userId,
      productId,
      orderId: verifiedOrderId,
      rating,
      comment,
    })
    .returning();

  return review;
}
