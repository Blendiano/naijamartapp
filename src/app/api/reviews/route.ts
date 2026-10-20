import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProductReview } from "@/services/reviews";
import { z } from "zod";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { handleRouteError, parseBody } from "@/lib/api-routes";

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

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const parsed = parseBody(reviewSchema, body.data);
    if (!parsed.ok) return parsed.response;

    const review = await createProductReview(
      session.user.id,
      parsed.data.productId,
      parsed.data.rating,
      parsed.data.comment
    );

    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    // Never echo error.message here: the service may throw driver errors that
    // embed SQL and parameters, and there is no client contract on the text.
    return handleRouteError(
      error,
      "[Reviews] Create review error",
      "Failed to submit review",
      400
    );
  }
}
