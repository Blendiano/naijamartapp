import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { processSuccessfulPayment } from "@/services/payments";
import { logError } from "@/lib/utils/error-log";
import { resolveAppUrl } from "@/lib/utils/app-url";

interface PaystackWebhookEvent {
  event?: string;
  data?: {
    reference?: string;
    id?: number;
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json(
      { success: false, error: { message: "Missing signature header" } },
      { status: 401 }
    );
  }

  // 1. Verify HMAC SHA-512 signature against Paystack secret key
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn("[Paystack Webhook] Invalid signature rejected");
    return NextResponse.json(
      { success: false, error: { message: "Invalid signature" } },
      { status: 401 }
    );
  }

  // 2. Parse payload safely
  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch (error) {
    logError("payments/webhook: malformed JSON payload", error);
    return NextResponse.json(
      { success: false, error: { message: "Malformed payload" } },
      { status: 400 }
    );
  }

  // 3. Handle charge.success event idempotently
  if (event.event === "charge.success") {
    const reference = event.data?.reference;

    if (reference) {
      const result = await processSuccessfulPayment(
        reference,
        event.data?.id?.toString(),
        { appUrl: resolveAppUrl({ configuredUrl: process.env.NEXT_PUBLIC_APP_URL, request: req }) }
      );

      if (!result.success) {
        // Acknowledge with a non-2xx status so Paystack redelivers the
        // event later. Processing is idempotent, so a retry is safe and a
        // transient database failure will not silently lose the payment.
        return NextResponse.json(
          {
            success: false,
            error: { message: "Failed to process charge.success event" },
          },
          { status: 500 }
        );
      }
    }
  }

  // Unknown or successfully processed events are acknowledged with 200 OK.
  return NextResponse.json({ success: true, message: "Webhook processed" });
}
