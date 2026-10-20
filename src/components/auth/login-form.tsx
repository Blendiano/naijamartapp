"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { authFormStyles } from "@/components/auth/auth-styles";
import { PasswordField } from "@/components/auth/password-field";
import { IdleEscalationInit } from "./idle-escalation-init";

interface LoginFormProps {
  callbackUrl?: string;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "This field cannot be empty")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "This field cannot be empty"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const SUCCESS_REDIRECT_DELAY_MS = 2500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LoginForm({ callbackUrl = "/store" }: LoginFormProps) {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function safeCallbackUrl(url: string): string {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    return "/store";
  }

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    setLoginSuccess(false);

    const result = await signIn("credentials", {
      email: values.email.toLowerCase().trim(),
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    setLoginSuccess(true);

    await wait(SUCCESS_REDIRECT_DELAY_MS);

    router.push(safeCallbackUrl(callbackUrl));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={authFormStyles.form} noValidate>
      <div className={authFormStyles.field}>
        <label htmlFor="email" className={authFormStyles.label}>
          Enter email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={authFormStyles.input}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <PasswordField
        id="password"
        label="Enter password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        inputProps={register("password")}
      >
        <div className="mt-4.5 flex items-center justify-between">
          <label
            htmlFor="rememberMe"
            className="flex items-center gap-2 text-sm font-bold text-[color:var(--sys-color-primary)]"
          >
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              {...register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            href="/auth/forgot-password"
            className="cursor-pointer text-[length:var(--sys-font-size-sm)] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Forgot Password?
          </Link>
        </div>
      </PasswordField>

      {authError && (
        <p className={authFormStyles.alert} role="alert">
          {authError}
        </p>
      )}

      {loginSuccess && (
        <div className="flex justify-center">
          <Badge
            variant="success"
            role="status"
            aria-live="polite"
            data-icon="inline-start"
          >
            <CheckCircle2 aria-hidden="true" />
            Logged in successfully
          </Badge>
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className={authFormStyles.submit}>
        {isSubmitting ? "Signing in..." : "Sign In"}
        <ArrowRight
          className="ml-1.5"
          aria-hidden="true"
          data-icon="inline-end"
        />
      </Button>

      <div
        className={cn(
          authFormStyles.footer,
          "text-[length:var(--sys-font-size-xs)]",
          "-mt-4"
        )}
      >
        <span>Don&apos;t have an account? </span>
        <Link href="/auth/signup" className={authFormStyles.footerLink}>
          Create one
        </Link>
      </div>

      <div className="mt-0 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[length:var(--sys-font-size-xs)] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back home
        </Link>
      </div>
    <IdleEscalationInit /></form>
  );
}