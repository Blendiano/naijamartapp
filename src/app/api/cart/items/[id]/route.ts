import { NextRequest, NextResponse } from "next/server";
import { updateCartItemQuantity, removeCartItem } from "@/services/cart";
import { z } from "zod";

const updateSchema = z.object({
  quantity: z.number().int().min(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid quantity" } },
        { status: 400 }
      );
    }

    await updateCartItemQuantity(id, parsed.data.quantity);
    return NextResponse.json({ success: true, data: { id, quantity: parsed.data.quantity } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await removeCartItem(id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove item";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
