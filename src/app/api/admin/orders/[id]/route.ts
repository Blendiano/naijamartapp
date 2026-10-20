import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateOrderStatus } from "@/services/orders";
import { ORDER_STATUSES } from "@/lib/order-status";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import {
  handleRouteError,
  parseBody,
  requireAdmin,
} from "@/lib/api-routes";

// Derived from the shared list so the API, database enum and UI cannot drift.
const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { id } = await params;

    const body = await readJsonBody(req, BODY_LIMITS.small);
    if (!body.ok) return body.response;

    const parsed = parseBody(statusSchema, body.data);
    if (!parsed.ok) return parsed.response;

    await updateOrderStatus(id, parsed.data.status);

    return NextResponse.json({
      success: true,
      data: { id, status: parsed.data.status },
    });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Admin] Order status update error",
      "Failed to update order status",
      400
    );
  }
}
