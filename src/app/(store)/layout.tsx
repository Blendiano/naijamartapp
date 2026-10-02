import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { getCartCount } from "@/services/cart";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("naijamart_session")?.value;

  const cartCount = await getCartCount(session?.user?.id, sessionId);

  return (
    <>
      <Navbar cartCount={cartCount} />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </>
  );
}