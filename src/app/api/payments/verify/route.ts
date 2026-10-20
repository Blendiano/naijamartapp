import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/payments/paystack";
import { processSuccessfulPayment } from "@/services/payments";
import { logError } from "@/lib/utils/error-log";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { success: false, error: { message: "Reference is required" } },
        { status: 400 }
      );
    }

    // Call Paystack verify API
    const verifiedData = await verifyTransaction(reference);

    if (verifiedData.status !== "success") {
      return NextResponse.json({
        success: false,
        error: { message: `Payment status: ${verifiedData.status}` },
        data: { status: verifiedData.status, reference },
      });
    }

    // Record the verified payment idempotently and confirm the order.
    const result = await processSuccessfulPayment(
      reference,
      verifiedData.reference
    );

    if (!result.success) {
      // Paystack confirmed the charge but we could not record it. The failure
      // details are logged server-side by the service; the customer sees a
      // plain-language message and can retry verification.
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "We could not confirm your payment. Please try again in a moment.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: "paid",
        reference,
        orderNumber: result.orderNumber,
        alreadyProcessed: result.alreadyProcessed ?? false,
      },
    });
  } catch (error: unknown) {
    logError("payments/verify", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "We could not verify your payment. Please try again shortly.",
        },
      },
      { status: 400 }
    );
  }
}
