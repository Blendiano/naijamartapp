import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateOrderStatus } from "@/services/orders";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Server-side admin authorization guard
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized admin operation" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid status value" } },
        { status: 400 }
      );
    }

    await updateOrderStatus(id, parsed.data.status);

    return NextResponse.json({
      success: true,
      data: { id, status: parsed.data.status },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update order status";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
