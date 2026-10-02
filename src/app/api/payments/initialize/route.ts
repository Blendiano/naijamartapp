import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/services/cart";
import { prepareCheckoutOrder } from "@/services/checkout";
import { initializeTransaction } from "@/lib/payments/paystack";
import { z } from "zod";

const initializeSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Phone number is required"),
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  deliveryOptionId: z.string().uuid("Delivery option is required"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionId = req.cookies.get("naijamart_session")?.value;
    const cartId = await getOrCreateCart(session?.user?.id, sessionId);

    const body = await req.json();
    const parsed = initializeSchema.safeParse(body);

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

    // Prepare order and pending payment on server
    const prepared = await prepareCheckoutOrder(
      cartId,
      session?.user?.id,
      parsed.data
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const callbackUrl = `${appUrl}/payment/callback?reference=${prepared.paymentReference}`;

    // Initialize Paystack transaction (amount in kobo)
    const paystackRes = await initializeTransaction({
      email: prepared.customerEmail,
      amount: prepared.total,
      reference: prepared.paymentReference,
      callback_url: callbackUrl,
      metadata: {
        orderId: prepared.orderId,
        orderNumber: prepared.orderNumber,
        customerName: parsed.data.customerName,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        authorizationUrl: paystackRes.authorization_url,
        reference: prepared.paymentReference,
        orderNumber: prepared.orderNumber,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
