import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateCart } from "@/services/cart";
import { CheckoutError, prepareCheckoutOrder } from "@/services/checkout";
import { initializeTransaction } from "@/lib/payments/paystack";
import { z } from "zod";
import { logError } from "@/lib/utils/error-log";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { tooManyRequests } from "@/lib/security/http";

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
    // Guests may check out, so this is limited per IP rather than per account.
    // Each call writes an order and calls Paystack, so it is worth metering.
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.paymentsIp,
      key: getClientIp(req.headers),
      policy: RATE_LIMIT_POLICIES.paymentsIp,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "Too many checkout attempts have been made from this connection."
      );
    }

    const session = await auth();
    const sessionId = req.cookies.get("naijamart_session")?.value;
    const cartId = await getOrCreateCart(session?.user?.id, sessionId);

    const body = await readJsonBody(req, BODY_LIMITS.large);
    if (!body.ok) return body.response;

    const parsed = initializeSchema.safeParse(body.data);

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
    // CheckoutError messages are plain language and safe to show; anything
    // else (database, Paystack, network) is logged and replaced with a
    // generic message so internals never reach the browser.
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 }
      );
    }
    logError("payments/initialize", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "We could not start your checkout. Please try again." },
      },
      { status: 400 }
    );
  }
}
