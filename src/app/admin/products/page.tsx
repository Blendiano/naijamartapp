import { getProducts } from "@/services/products";
import { formatNaira } from "@/lib/utils/money";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Product Management - Admin",
};

export default async function AdminProductsPage() {
  const productsList = await getProducts({ limit: 100 });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Product Catalogue Management
          </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Add, update, and manage Nigerian fashion products.
          </p>
        </div>

        <Link href="/admin/products/new">
          <Button className="gap-2 h-11 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
        {productsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-semibold">Image</th>
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Base Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productsList.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="py-3">
                      <div className="relative h-12 w-10 overflow-hidden rounded border border-border bg-muted">
                        {p.primaryImage ? (
                          <Image
                            src={p.primaryImage.url}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60">
                            <Shirt className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-foreground">{p.name}</td>
                    <td className="py-3 font-mono text-muted-foreground">{p.sku ?? "—"}</td>
                    <td className="py-3 font-medium">{p.category?.name ?? "Uncategorized"}</td>
                    <td className="py-3 font-bold text-sm text-primary">
                      {formatNaira(p.basePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <Package className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold">No products created yet</p>
            <Link href="/admin/products/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add your first product
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}