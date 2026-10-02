"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    reference ? "verifying" : "error"
  );
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    reference ? null : "No payment reference found in URL."
  );

  useEffect(() => {
    if (!reference) {
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Payment verification failed.");
        }

        setStatus("success");
        setOrderNumber(data.data.orderNumber);
      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      }
    }

    verify();
  }, [reference]);

  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-border bg-card text-center flex flex-col items-center gap-6">
      {status === "verifying" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Verifying Payment...</h1>
            <p className="text-sm mt-1 text-muted-foreground">
              Please wait while we confirm your payment with Paystack.
            </p>
          </div>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="h-16 w-16 text-success" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Successful!</h1>
            <p className="text-sm mt-2 text-muted-foreground">
              Thank you for shopping with NaijaMart. Your order has been placed.
            </p>
            {orderNumber && (
              <div className="mt-4 p-3 rounded-lg bg-muted text-xs font-mono font-bold text-foreground">
                Order #{orderNumber}
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-3 mt-2">
            <Link href="/orders" className="w-full">
              <Button className="w-full h-11 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <ShoppingBag className="h-4 w-4" />
                View My Orders
              </Button>
            </Link>
            <Link href="/products" className="w-full">
              <Button variant="outline" className="w-full h-11 text-xs font-semibold gap-2">
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Payment Verification Issue</h1>
            <p className="text-sm mt-2 text-muted-foreground">{errorMsg}</p>
          </div>

          <div className="flex flex-col w-full gap-3 mt-2">
            <Link href="/checkout" className="w-full">
              <Button className="w-full h-11 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                Return to Checkout
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
