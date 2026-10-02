"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { authFormStyles } from "@/components/auth/auth-styles";

interface LoginFormProps {
  callbackUrl?: string;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "This field cannot be empty")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "This field cannot be empty"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({ callbackUrl = "/store" }: LoginFormProps) {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function safeCallbackUrl(url: string): string {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    return "/store";
  }

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
      return;
    }

    toast.success("Welcome back to NaijaMart!");
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
        {errors.email?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={authFormStyles.field}>
        <div className={authFormStyles.fieldHeader}>
          <label htmlFor="password" className={authFormStyles.label}>
            Enter password
          </label>
          <Link
            href="/auth/forgot-password"
            className="cursor-pointer text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Forgot Password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={authFormStyles.input}
          {...register("password")}
        />
        {errors.password?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {authError && (
        <p className={authFormStyles.alert} role="alert">
          {authError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className={authFormStyles.submit}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing
            in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className={authFormStyles.footer}>
        <span>Don&apos;t have an account? </span>
        <Link href="/auth/signup" className={authFormStyles.footerLink}>
          Create one
        </Link>
      </div>
    </form>
  );
}