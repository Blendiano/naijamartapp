"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CheckCircle2 } from "lucide-react";
import { cn } from "cn";
import { authFormStyles } from "@/components/auth/auth-styles";
import { IdleEscalationInit } from "./idle-escalation-init";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "This field cannot be empty")
    .email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error?.message ?? "Failed to send reset link.");
        return;
      }

      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">Check your inbox</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            If an account exists for{" "}
            <span className="font-semibold text-foreground">{submittedEmail}</span>, we
            have sent instructions to reset your password.
          </p>
        </div>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ className: "mt-2 w-full" }))}
        >
          Return to Sign In
        </Link>
      </div>
    );
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

      <Button type="submit" loading={isSubmitting} className={authFormStyles.submit}>
        {isSubmitting ? "Sending link..." : "Send Reset Link"}
      </Button>

      <div className={authFormStyles.footer}>
        <span>Remembered your password? </span>
        <Link href="/auth/login" className={authFormStyles.footerLink}>
          Sign In
        </Link>
      </div>
    <IdleEscalationInit /></form>
  );
}