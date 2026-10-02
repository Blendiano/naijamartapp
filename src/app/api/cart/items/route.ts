import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateCart, getCartWithItems, addItemToCart } from "@/services/cart";
import { z } from "zod";

const addItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive().default(1),
});

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
    const message = error instanceof Error ? error.message : "Failed to fetch cart";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionId = req.cookies.get("naijamart_session")?.value;

    const body = await req.json();
    const parsed = addItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

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
    const message = error instanceof Error ? error.message : "Failed to add item to cart";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
