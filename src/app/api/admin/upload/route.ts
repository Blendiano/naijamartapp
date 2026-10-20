import { NextRequest, NextResponse } from "next/server";
import { uploadProductImage } from "@/lib/storage/blob";
import { handleRouteError, jsonError, requireAdmin } from "@/lib/api-routes";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError("No file uploaded", 400);
    }

    const result = await uploadProductImage(file, "products");

    return NextResponse.json({
      success: true,
      data: { url: result.url },
    });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Admin] Image upload error",
      "Image upload failed",
      500
    );
  }
}
