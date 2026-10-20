"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { nairaToKobo } from "@/lib/utils/money";

interface CategoryOption {
  id: string;
  name: string;
}

interface NewProductClientProps {
  categories: CategoryOption[];
}

const productSchema = z.object({
  name: z.string().min(2, "Please enter a product name"),
  nairaPrice: z
    .string()
    .min(1, "Please enter a price")
    .refine(
      (v) => {
        const n = parseFloat(v);
        return !isNaN(n) && n > 0;
      },
      { message: "Enter a valid price greater than 0" }
    ),
  categoryId: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const inputStyles =
  "h-11 px-3.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring";

const sectionCard =
  "p-6 rounded-2xl border border-border bg-card flex flex-col gap-4";

export function NewProductClient({ categories }: NewProductClientProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      nairaPrice: "",
      categoryId: categories[0]?.id ?? "",
    },
  });

  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [variants, setVariants] = useState<
    { size: string; color: string; quantity: number }[]
  >([
    { size: "S", color: "Standard", quantity: 10 },
    { size: "M", color: "Standard", quantity: 15 },
    { size: "L", color: "Standard", quantity: 10 },
  ]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Upload failed");
      }

      setImageUrl(data.data.url);
      toast.success("Image uploaded successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function addVariant() {
    setVariants((prev) => [...prev, { size: "M", color: "New Color", quantity: 10 }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(values: ProductFormValues) {
    // Convert Naira float input to integer Kobo minor units
    const koboBasePrice = nairaToKobo(parseFloat(values.nairaPrice));

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || undefined,
          basePrice: koboBasePrice,
          categoryId: values.categoryId,
          imageUrl: imageUrl || undefined,
          variants,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to create product");
      }

      toast.success(`Product "${values.name}" created!`);
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating product");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleCreate)}
      className="flex flex-col gap-8 max-w-3xl"
      noValidate
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create New Product
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Add a new piece to the NaijaMart catalogue with variants and image asset.
        </p>
      </div>

      {/* Basic Details */}
      <div className={sectionCard}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Product Details
        </h2>

        <div className="flex flex-col gap-1.5 text-sm">
          <label className="font-medium text-xs text-foreground">
            Product Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Silk Agbada Set"
            className={inputStyles}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-xs text-foreground">
              Price in Naira (NGN) *
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 25000"
              className={inputStyles}
              {...register("nairaPrice")}
            />
            <FieldError message={errors.nairaPrice?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-xs text-foreground">
              Category *
            </label>
            <select className={inputStyles} {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId?.message} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <label className="font-medium text-xs text-foreground">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Detailed description of craftsmanship, fabric, and fit..."
            className="p-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("description")}
          />
        </div>
      </div>

      {/* Image Upload */}
      <div className={sectionCard}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Product Image (Vercel Blob)
        </h2>

        <div className="flex items-center gap-4">
          <div className="relative h-28 w-24 overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
            {imageUrl ? (
              <Image src={imageUrl} alt="Product preview" fill className="object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer"
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? "Uploading..." : "Choose Image File"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {imageUrl && (
              <p className="text-[11px] font-mono text-muted-foreground truncate max-w-xs">
                {imageUrl}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Variants & Inventory */}
      <div className={sectionCard}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Variants & Stock
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
          >
            <Plus className="h-3.5 w-3.5" /> Add Variant
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {variants.map((v, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 items-center text-xs p-3 rounded-lg border border-border bg-background"
            >
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Size (S, M, L)"
                  value={v.size}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariants((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, size: val } : item
                      )
                    );
                  }}
                  className="w-full h-9 px-2.5 rounded border border-input bg-transparent"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="text"
                  placeholder="Color (e.g. Teal)"
                  value={v.color}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariants((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, color: val } : item
                      )
                    );
                  }}
                  className="w-full h-9 px-2.5 rounded border border-input bg-transparent"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="number"
                  placeholder="Stock Qty"
                  value={v.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setVariants((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, quantity: val } : item
                      )
                    );
                  }}
                  className="w-full h-9 px-2.5 rounded border border-input bg-transparent"
                />
              </div>
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        loading={isSubmitting}
      >
        {isSubmitting ? "Creating Product..." : "Save and Publish Product"}
      </Button>
    </form>
  );
}