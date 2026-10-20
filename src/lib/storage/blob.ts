import { put } from "@vercel/blob";
import type { PutBlobResult } from "@vercel/blob";
import { validateImageFile } from "@/lib/security/file-validation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
}

/**
 * Upload a product image to Vercel Blob storage.
 * Only allows image types up to 5MB with magic-byte validation.
 */
export async function uploadProductImage(
  file: File,
  productSlug: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: 5 MB`
    );
  }

  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Invalid image file");
  }

  const ext = file.type.split("/")[1];
  const filename = `products/${productSlug}/${Date.now()}.${ext}`;

  const result: PutBlobResult = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return {
    url: result.url,
    pathname: result.pathname,
    contentType: result.contentType,
  };
}
