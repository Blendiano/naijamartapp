"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "cn";
import { authFormStyles } from "@/components/auth/auth-styles";
import { PasswordField } from "@/components/auth/password-field";
import { IdleEscalationInit } from "./idle-escalation-init";
import {
  getFirstUnmetRule,
  PASSWORD_RULE_MESSAGES,
} from "@/lib/auth/password-rules";
import { PasswordRequirements } from "@/components/auth/password-requirements";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "This field cannot be empty")
      .superRefine((value, ctx) => {
        const unmet = getFirstUnmetRule(value);
        if (unmet) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: PASSWORD_RULE_MESSAGES[unmet.id],
          });
        }
      }),
    confirmPassword: z.string().min(1, "This field cannot be empty"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [passwordValue, setPasswordValue] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...values }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message =
          data.error?.message ?? "Failed to update your password.";
        setFormError(message);
        toast.error(message);
        return;
      }

      setPasswordUpdated(true);
      toast.success("Password updated successfully");
    } catch {
      const message = "An unexpected error occurred. Please try again.";
      setFormError(message);
      toast.error(message);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="p-3 rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">Invalid reset link</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            This link is missing its reset token. Request a new one and we&apos;ll
            email you a fresh link.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className={cn(buttonVariants({ className: "mt-2 w-full" }))}
        >
          Request a New Link
        </Link>
      </div>
    );
  }

  if (passwordUpdated) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">
            Password updated
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Your password has been changed. You can now sign in with your new
            password.
          </p>
        </div>
        <Link
          href="/auth/login"
          className={cn(buttonVariants({ className: "mt-2 w-full" }))}
        >
          Continue to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={authFormStyles.form}
      noValidate
    >
      <PasswordField
        id="password"
        label="Enter new password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        toggleTabIndex={-1}
        error={errors.password?.message}
        inputProps={{
          ...register("password", {
            onChange: (event) => setPasswordValue(event.target.value),
            onBlur: () => setPasswordFocused(false),
          }),
          onFocus: () => setPasswordFocused(true),
          "aria-describedby": "password-requirements",
        }}
      >
        <div id="password-requirements">
          <PasswordRequirements
            value={passwordValue}
            focused={passwordFocused}
          />
        </div>
      </PasswordField>

      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        toggleTabIndex={-1}
        showLabel="Show password confirmation"
        hideLabel="Hide password confirmation"
        error={errors.confirmPassword?.message}
        inputProps={register("confirmPassword")}
      />

      {formError && (
        <p className={authFormStyles.alert} role="alert">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={!isValid}
        className={authFormStyles.submit}
      >
        {isSubmitting ? "Updating Password..." : "Update Password"}
        <ArrowRight
          className="ml-1.5"
          aria-hidden="true"
          data-icon="inline-end"
        />
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
