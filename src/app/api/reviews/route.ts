import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProductReview } from "@/services/reviews";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: "Authentication required to submit review" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Validation failed", details: parsed.error.format() } },
        { status: 400 }
      );
    }

    const review = await createProductReview(
      session.user.id,
      parsed.data.productId,
      parsed.data.rating,
      parsed.data.comment
    );

    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
