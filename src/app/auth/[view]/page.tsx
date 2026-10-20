import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isAuthView, type AuthView } from "@/lib/auth/views";

interface AuthCopy {
  title: string;
  description: string;
}

const AUTH_COPY: Record<AuthView, AuthCopy> = {
  login: {
    title: "Welcome back",
    description: "Sign in to your Account.",
  },
  signup: {
    title: "Create your Account",
    description: "Your style journey starts here.",
  },
  "forgot-password": {
    title: "Forgot your password?",
    description:
      "No worries. Enter your email address and we'll send you a link to reset your password.",
  },
  "reset-password": {
    title: "Set a new password",
    description: "Choose a new password for your NaijaMart account.",
  },
};

interface AuthPageProps {
  params: Promise<{ view: string }>;
  searchParams: Promise<{ callbackUrl?: string; token?: string }>;
}

export async function generateMetadata({
  params,
}: AuthPageProps): Promise<Metadata> {
  const { view } = await params;

  if (!isAuthView(view)) {
    return { title: "NaijaMart" };
  }

  const copy = AUTH_COPY[view];

  return {
    title: `${copy.title} — NaijaMart`,
    description: copy.description,
  };
}

export default async function AuthPage({ params, searchParams }: AuthPageProps) {
  const { view } = await params;
  const { callbackUrl, token } = await searchParams;

  if (!isAuthView(view)) {
    notFound();
  }

  const copy = AUTH_COPY[view];

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-surface-dim">
      <div className="w-full max-w-[420px] flex flex-col gap-3">
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-8">
          <Link
            href="/"
            aria-label="NaijaMart home"
            className="text-2xl font-extrabold tracking-tight text-primary transition-opacity hover:opacity-90"
          >
            NaijaMart
          </Link>
          <div className="flex flex-col gap-0 self-stretch text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {copy.title}
            </h1>
            <p className="text-[length:var(--sys-font-size-sm)] text-muted-foreground">
              {copy.description}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full rounded-3xl bg-surface px-6 py-6 shadow-md sm:px-8 sm:py-8">
          {view === "login" && <LoginForm callbackUrl={callbackUrl} />}
          {view === "signup" && <SignupForm />}
          {view === "forgot-password" && <ForgotPasswordForm />}
          {view === "reset-password" && <ResetPasswordForm token={token ?? ""} />}
        </div>
      </div>
    </div>
  );
}