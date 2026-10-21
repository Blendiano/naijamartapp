"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { CheckCircle2, XCircle, MailWarning } from "lucide-react";
import { cn } from "cn";

/**
 * The page a customer lands on after following a verification link.
 *
 * A link that has expired, been truncated or already been used must explain
 * what happened and offer the next step — a raw JSON error is not an answer a
 * customer can act on.
 */
export type VerificationResultStatus =
  | "success"
  | "already"
  | "expired"
  | "invalid"
  | "error"
  | "resend";

const RESULT_COPY: Record<
  VerificationResultStatus,
  { title: string; body: string; tone: "success" | "error" | "neutral" }
> = {
  success: {
    title: "Your email address is verified",
    body: "Thank you — your account is now fully set up. You can shop with confidence.",
    tone: "success",
  },
  already: {
    title: "Your email address was already verified",
    body: "This account has already been confirmed, so there is nothing left to do.",
    tone: "success",
  },
  expired: {
    title: "This verification link has expired",
    body: "Verification links are time limited. Request a new one and we will send it straight to your inbox.",
    tone: "error",
  },
  invalid: {
    title: "This verification link is not valid",
    body: "The link may have been truncated or already used. Request a new one and we will send it straight to your inbox.",
    tone: "error",
  },
  error: {
    title: "We could not verify your email",
    body: "Something went wrong on our side. Please try again, or request a new verification link.",
    tone: "error",
  },
  resend: {
    title: "Request a new verification link",
    body: "We will send a fresh verification link to the email address on your account. The link works on any device.",
    tone: "neutral",
  },
};

export interface VerificationResultProps {
  status: VerificationResultStatus;
  /** Whether the visitor is signed in, which decides if a resend is possible. */
  isSignedIn: boolean;
}

export function VerificationResult({
  status,
  isSignedIn,
}: VerificationResultProps) {
  const copy = RESULT_COPY[status] ?? RESULT_COPY.error;
  const isResolved = status === "success" || status === "already";

  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border border-border bg-card flex flex-col items-center gap-6 text-center">
      {copy.tone === "success" ? (
        <CheckCircle2 className="h-16 w-16 text-success" aria-hidden="true" />
      ) : copy.tone === "error" ? (
        <XCircle className="h-16 w-16 text-destructive" aria-hidden="true" />
      ) : (
        <MailWarning className="h-16 w-16 text-primary" aria-hidden="true" />
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {copy.title}
        </h1>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
      </div>

      <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-center">
        {isSignedIn && !isResolved ? (
          <ResendVerificationButton
            label="Send me a new link"
            successMessage="Verification email sent. Please check your inbox."
          />
        ) : null}

        {isSignedIn ? (
          <Link
            href="/store"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Continue shopping
          </Link>
        ) : (
          <Link href="/auth/login" className={cn(buttonVariants())}>
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
