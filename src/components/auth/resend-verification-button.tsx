"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Requests a new email-verification link.
 *
 * The server decides whether the mail can be sent and reports the real
 * outcome, so a failed send is shown as a failure instead of a reassuring
 * "email sent" message that never arrives.
 */
export interface ResendVerificationButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
  /** Label shown while the button is idle. */
  label?: string;
  /** Message shown after a successful send. */
  successMessage?: string;
}

export function ResendVerificationButton({
  variant = "default",
  size = "default",
  className,
  label = "Resend verification email",
  successMessage = "Verification email sent. Please check your inbox.",
}: ResendVerificationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

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

      if (res.ok && data.success) {
        toast.success(successMessage, {
          description:
            "You can open the link on any device — phone, tablet or computer.",
        });
        startCooldown(data.retryAfter ?? 60);
        return;
      }

      toast.error(data.error?.message ?? "Failed to send verification email.");
      if (data.retryAfter) startCooldown(data.retryAfter);
    } catch {
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      loading={loading}
      disabled={cooldown > 0}
      onClick={handleResend}
    >
      {cooldown > 0 ? `Resend in ${cooldown}s` : label}
    </Button>
  );
}
