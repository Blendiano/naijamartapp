import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "Saved NaijaMart pieces you want to come back to.",
};

export default function WishlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Wishlist
        </h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Pieces you have saved on this device.
        </p>
      </div>

      <WishlistView />
    </div>
  );
}
