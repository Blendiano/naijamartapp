import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/payments/paystack";
import { processSuccessfulPayment } from "@/services/payments";

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

    // Process idempotent payment and order update
    const result = await processSuccessfulPayment(
      reference,
      verifiedData.reference
    );

    return NextResponse.json({
      success: true,
      data: {
        status: "paid",
        reference,
        orderNumber: result.orderNumber,
        alreadyProcessed: result.alreadyProcessed,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
