import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Shield } from "lucide-react";

export const metadata = {
  title: "NaijaMart Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Strict server-side authorization guard
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between p-6 flex-shrink-0 hidden md:flex">
        <div className="flex flex-col gap-8">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-primary">
              NaijaMart
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
              Admin
            </span>
          </Link>

          <nav className="flex flex-col gap-1 text-sm font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-primary" />
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <Package className="h-4 w-4 text-primary" />
              Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              Orders
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Logged in as Admin</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}