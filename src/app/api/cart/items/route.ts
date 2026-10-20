import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateCart, getCartWithItems, addItemToCart } from "@/services/cart";
import { z } from "zod";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import {
  handleRouteError,
  jsonError,
  parseBody,
} from "@/lib/api-routes";

const addItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive().default(1),
});

/**
 * The cart service throws plain `Error`s with user-facing text (e.g.
 * "Only 2 item(s) available in stock") that the product pages display
 * directly, so those messages are relayed to the client. Database/driver
 * failures (DrizzleQueryError and its duck-typed equivalents) embed SQL and
 * parameters in `message` and are never relayed — they are logged and
 * replaced with a generic message.
 */
function isUserFacingError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.name !== "DrizzleQueryError" &&
    !("query" in error && "params" in error)
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const sessionId = req.cookies.get("naijamart_session")?.value;

    const cartId = await getOrCreateCart(session?.user?.id, sessionId);
    const cart = await getCartWithItems(cartId);

    const res = NextResponse.json({ success: true, data: cart });

    // Set guest session cookie if not set
    if (!session?.user?.id && !sessionId) {
      res.cookies.set("naijamart_session", cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res;
  } catch (error: unknown) {
    return handleRouteError(error, "[Cart] Fetch cart error", "Failed to fetch cart", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionId = req.cookies.get("naijamart_session")?.value;

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const parsed = parseBody(addItemSchema, body.data);
    if (!parsed.ok) return parsed.response;

    const cartId = await getOrCreateCart(session?.user?.id, sessionId);
    await addItemToCart(cartId, parsed.data.variantId, parsed.data.quantity);

    const updatedCart = await getCartWithItems(cartId);

    const res = NextResponse.json({ success: true, data: updatedCart });

    if (!session?.user?.id && !sessionId) {
      res.cookies.set("naijamart_session", cartId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return res;
  } catch (error: unknown) {
    // User-facing service errors (stock limits etc.) keep their message;
    // anything else is logged and replaced with a generic message.
    if (isUserFacingError(error)) {
      return jsonError(error.message, 400);
    }
    return handleRouteError(
      error,
      "[Cart] Add item error",
      "Failed to add item to cart",
      400
    );
  }
}
