import { db } from "@/db";
import { products, productImages, productVariants, inventory } from "@/db/schema";
import { generateSku } from "@/lib/utils/order-number";
import { logError } from "@/lib/utils/error-log";
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name is required").max(200),
  description: z.string().max(5000).optional(),
  basePrice: z.number().int().positive("Price must be a positive integer kobo amount"),
  categoryId: z.string().uuid("Valid category ID is required"),
  imageUrl: z.string().url("Valid image URL required").optional(),
  variants: z
    .array(
      z.object({
        size: z.string().max(50).optional(),
        color: z.string().max(50).optional(),
        quantity: z.number().int().min(0).default(10),
      })
    )
    .max(50, "A product can have at most 50 variants")
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
  details?: unknown;
}

export async function createProduct(input: CreateProductInput): Promise<CreateProductResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.format(),
    };
  }

  const { name, description, basePrice, categoryId, imageUrl, variants } = parsed.data;

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sku = generateSku(name);

  try {
    return await db.transaction(async (tx) => {
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

      if (imageUrl) {
        await tx.insert(productImages).values({
          productId: product.id,
          url: imageUrl,
          altText: name,
          isPrimary: true,
          displayOrder: 0,
        });
      }

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

      return {
        success: true,
        productId: product.id,
      };
    });
  } catch (error) {
    // Database errors (unique-slug violations, connectivity, …) must never
    // reach the client — they are logged sanitized and replaced by a
    // plain-language message.
    logError("products/createProduct", error);
    return {
      success: false,
      error: "We could not create the product. Please try again.",
    };
  }
}
