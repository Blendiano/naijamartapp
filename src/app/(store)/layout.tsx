import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { getCartCount } from "@/services/cart";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("naijamart_session")?.value;

  const cartCount = await getCartCount(session?.user?.id, sessionId);

  const fullName = session?.user?.name?.trim() ?? "";
  const userSurname = fullName ? fullName.split(/\s+/).pop() : undefined;

  let showVerificationBanner = false;
  if (session?.user?.id) {
    const [user] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (user && !user.emailVerified) {
      showVerificationBanner = true;
    }
  }

  return (
    <>
      {showVerificationBanner && <EmailVerificationBanner />}
      <Navbar cartCount={cartCount} userSurname={userSurname} />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </>
  );
}