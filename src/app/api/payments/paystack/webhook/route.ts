import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/paystack";
import { processSuccessfulPayment } from "@/services/payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: { message: "Missing signature header" } },
        { status: 401 }
      );
    }

    // 1. Verify HMAC SHA-512 signature against Paystack secret key
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Paystack Webhook] Invalid signature rejected");
      return NextResponse.json(
        { success: false, error: { message: "Invalid signature" } },
        { status: 401 }
      );
    }

    // 2. Parse payload safely
    const event = JSON.parse(rawBody);

    // 3. Handle charge.success event idempotently
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;

      if (reference) {
        console.log(`[Paystack Webhook] Processing charge.success for ref: ${reference}`);
        await processSuccessfulPayment(reference, data.id?.toString());
      }
    }

    // Always respond 200 OK promptly to acknowledge receipt
    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: unknown) {
    console.error("[Paystack Webhook Error]", error);
    // Still return 200 to prevent Paystack spamming retries for unhandled formatting
    return NextResponse.json(
      { success: false, error: { message: "Error processing webhook" } },
      { status: 200 }
    );
  }
}
