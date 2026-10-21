import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  VerificationResult,
  type VerificationResultStatus,
} from "@/components/auth/verification-result";

export const metadata: Metadata = {
  title: "Email verification — NaijaMart",
  description: "Confirm your email address to finish setting up your NaijaMart account.",
};

const STATUSES: VerificationResultStatus[] = [
  "success",
  "already",
  "expired",
  "invalid",
  "error",
  "resend",
];

interface VerifyEmailPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { status } = await searchParams;
  const session = await auth();

  const resolvedStatus: VerificationResultStatus = STATUSES.includes(
    status as VerificationResultStatus
  )
    ? (status as VerificationResultStatus)
    : "error";

  return (
    <VerificationResult
      status={resolvedStatus}
      isSignedIn={Boolean(session?.user?.id)}
    />
  );
}
