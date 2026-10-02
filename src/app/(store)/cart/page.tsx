import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { getOrCreateCart, getCartWithItems } from "@/services/cart";
import { CartClient } from "@/components/cart/cart-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "View and manage items in your shopping cart.",
};

export default async function CartPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("naijamart_session")?.value;

  const cartId = await getOrCreateCart(session?.user?.id, sessionId);
  const cart = await getCartWithItems(cartId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CartClient initialCart={cart} />
    </div>
  );
}
