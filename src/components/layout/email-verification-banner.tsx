"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Verification email sent.", {
          description: "Please check your inbox and click the Verify My Email link.",
        });
        const retryAfter = data.retryAfter ?? 60;
        setCooldown(retryAfter);
        const interval = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) {
              clearInterval(interval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        toast.error(data.error?.message ?? "Failed to send verification email");
        if (data.retryAfter) {
          setCooldown(data.retryAfter);
          const interval = setInterval(() => {
            setCooldown((c) => {
              if (c <= 1) {
                clearInterval(interval);
                return 0;
              }
              return c - 1;
            });
          }, 1000);
        }
      }
    } catch {
      toast.error("Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200 py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-yellow-800">
          Verify your email  we&apos;ve sent a verification link to your email
          address. Please check your inbox to verify your account.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={loading}
            onClick={handleResend}
            disabled={cooldown > 0}
            className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
          >
            {cooldown > 0 ? ("Resend in " + cooldown + "s") : "Resend verification email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
