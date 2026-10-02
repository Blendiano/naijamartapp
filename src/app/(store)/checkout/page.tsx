import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { getOrCreateCart, getCartWithItems } from "@/services/cart";
import { getActiveDeliveryOptions } from "@/services/delivery";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with Paystack secure payment.",
};

export default async function CheckoutPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("naijamart_session")?.value;

  const cartId = await getOrCreateCart(session?.user?.id, sessionId);
  const cart = await getCartWithItems(cartId);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  const deliveryOptions = await getActiveDeliveryOptions();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <CheckoutClient
        cart={cart}
        deliveryOptions={deliveryOptions}
        userSession={session?.user}
      />
    </div>
  );
}
