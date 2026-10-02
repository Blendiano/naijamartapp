import { getCategories } from "@/services/products";
import { NewProductClient } from "@/components/admin/new-product-client";

export const metadata = {
  title: "New Product - Admin",
};

export default async function NewProductPage() {
  const categoriesList = await getCategories();

  return <NewProductClient categories={categoriesList} />;
}
