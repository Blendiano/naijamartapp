"use client";

import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

/**
 * The banner shown to a signed-in customer whose email address has not been
 * confirmed yet.
 */
export function EmailVerificationBanner() {
  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-200 py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-yellow-800">
          Verify your email — we have sent a verification link to your email
          address. Please check your inbox to verify your account.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <ResendVerificationButton
            size="sm"
            variant="outline"
            className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
            label="Resend verification email"
          />
        </div>
      </div>
    </div>
  );
}
