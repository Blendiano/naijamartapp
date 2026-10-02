import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadProductImage } from "@/lib/storage/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized upload" } },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: "No file uploaded" } },
        { status: 400 }
      );
    }

    const result = await uploadProductImage(file, "products");

    return NextResponse.json({
      success: true,
      data: { url: result.url },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}
