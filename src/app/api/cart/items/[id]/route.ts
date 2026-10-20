import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  resolveCartId,
  updateCartItemQuantity,
  removeCartItem,
} from "@/services/cart";
import { z } from "zod";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { handleRouteError } from "@/lib/api-routes";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
});

const NO_CART_MESSAGE = "No cart is associated with this request.";
// Same response whether the item does not exist or belongs to someone else,
// so cross-cart probing cannot reveal which cart items exist.
const NOT_FOUND_MESSAGE = "Cart item not found.";

/**
 * Cart item mutations are object-level authorized: the caller's cart is
 * resolved from the session (or the guest cart cookie) and the item is only
 * touched when it belongs to that cart.
 */
async function getCallerCartId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  const sessionId = req.cookies.get("naijamart_session")?.value;
  return resolveCartId(session?.user?.id, sessionId);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cartId = await getCallerCartId(req);
    if (!cartId) {
      return NextResponse.json(
        { success: false, error: { message: NO_CART_MESSAGE } },
        { status: 403 }
      );
    }

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const parsed = updateSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid quantity" } },
        { status: 400 }
      );
    }

    const updated = await updateCartItemQuantity(
      id,
      parsed.data.quantity,
      cartId
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { message: NOT_FOUND_MESSAGE } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, quantity: parsed.data.quantity },
    });
  } catch (error: unknown) {
    // The quantity-update service throws no user-facing errors (it returns
    // false for unknown/unowned items), so every failure here is unexpected
    // and gets a logged, generic response.
    return handleRouteError(
      error,
      "[Cart] Update item error",
      "Failed to update item",
      400
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cartId = await getCallerCartId(req);
    if (!cartId) {
      return NextResponse.json(
        { success: false, error: { message: NO_CART_MESSAGE } },
        { status: 403 }
      );
    }

    const removed = await removeCartItem(id, cartId);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: { message: NOT_FOUND_MESSAGE } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    // Same as PATCH: the remove service throws no user-facing errors.
    return handleRouteError(
      error,
      "[Cart] Remove item error",
      "Failed to remove item",
      400
    );
  }
}
