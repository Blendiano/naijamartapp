import { NextRequest, NextResponse } from "next/server";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { createProduct, createProductSchema } from "@/services/products/admin";
import {
  handleRouteError,
  jsonError,
  parseBody,
  requireAdmin,
} from "@/lib/api-routes";
import { logError } from "@/lib/utils/error-log";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const body = await readJsonBody(req, BODY_LIMITS.medium);
    if (!body.ok) return body.response;

    const parsed = parseBody(createProductSchema, body.data);
    if (!parsed.ok) return parsed.response;

    const result = await createProduct(parsed.data);

    if (!result.success) {
      // The service result can carry driver/database details, so it is only
      // logged server-side; the client receives a generic message (§16).
      logError("[Admin] Failed to create product", result.error);
      return jsonError("Failed to create product", 400);
    }

    return NextResponse.json(
      {
        success: true,
        data: { productId: result.productId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Admin] Product create error",
      "Failed to create product",
      400
    );
  }
}
