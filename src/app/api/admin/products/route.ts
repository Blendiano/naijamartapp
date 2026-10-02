import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, productImages, productVariants, inventory } from "@/db/schema";
import { z } from "zod";
import { generateSku } from "@/lib/utils/order-number";

const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  description: z.string().optional(),
  basePrice: z.number().int().positive("Price must be a positive integer kobo amount"),
  categoryId: z.string().uuid("Valid category ID is required"),
  imageUrl: z.string().url("Valid image URL required").optional(),
  variants: z
    .array(
      z.object({
        size: z.string().optional(),
        color: z.string().optional(),
        quantity: z.number().int().min(0).default(10),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Admin authorization guard
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized admin operation" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { name, description, basePrice, categoryId, imageUrl, variants } =
      parsed.data;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const sku = generateSku(name);

    return db.transaction(async (tx) => {
      // 1. Create Product
      const [product] = await tx
        .insert(products)
        .values({
          name,
          slug,
          description: description ?? null,
          basePrice,
          sku,
          categoryId,
          isActive: true,
        })
        .returning();

      // 2. Add Image if provided
      if (imageUrl) {
        await tx.insert(productImages).values({
          productId: product.id,
          url: imageUrl,
          altText: name,
          isPrimary: true,
          displayOrder: 0,
        });
      }

      // 3. Create Default Variant + Inventory if provided
      const variantList =
        variants && variants.length > 0
          ? variants
          : [{ size: "M", color: "Standard", quantity: 20 }];

      for (const v of variantList) {
        const variantSku = `${sku}-${(v.size || "STD").toUpperCase()}`;
        const [varRecord] = await tx
          .insert(productVariants)
          .values({
            productId: product.id,
            size: v.size ?? null,
            color: v.color ?? null,
            sku: variantSku,
            priceModifier: 0,
            isActive: true,
          })
          .returning();

        await tx.insert(inventory).values({
          variantId: varRecord.id,
          quantity: v.quantity ?? 20,
        });
      }

      return NextResponse.json({
        success: true,
        data: { id: product.id, slug: product.slug },
      });
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
