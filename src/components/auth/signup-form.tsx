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
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { authFormStyles } from "@/components/auth/auth-styles";
import { PasswordField } from "@/components/auth/password-field";
import { IdleEscalationInit } from "./idle-escalation-init";
import {
  getFirstUnmetRule,
  PASSWORD_RULE_MESSAGES,
} from "@/lib/auth/password-rules";
import { PasswordRequirements } from "@/components/auth/password-requirements";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "This field cannot be empty")
      .min(2, "Name must be at least 2 characters")
      .regex(
        /^\S+(\s+\S+)+$/,
        "Enter both first and last name separated by a space"
      ),
    email: z
      .string()
.min(1, "This field cannot be empty")
    .email("Enter a valid email address"),
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

type SignupFormValues = z.infer<typeof signupSchema>;

const SUCCESS_REDIRECT_DELAY_MS = 2500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);

  const [passwordValue, setPasswordValue] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: SignupFormValues) {
    setFormError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to create account");
      }

      setAccountCreated(true);

      // Automatically sign in after creation
      const signinRes = await signIn("credentials", {
        email: values.email.toLowerCase().trim(),
        password: values.password,
        redirect: false,
      });

      if (signinRes?.error) {
        toast.error("Something went wrong signing you in. Please sign in manually.", {
          id: "account-created-error",
          duration: 6000,
        });
        setFormError("Account created but automatic sign-in failed. Please sign in manually.");
        router.push("/auth/login");
      } else {
        setAccountCreated(true);
        // toast.success("Account created successfully!", {
        //   id: "account-created",
        //   duration: 4000,
        // });
        await wait(SUCCESS_REDIRECT_DELAY_MS);
        router.push("/store");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setFormError(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={authFormStyles.form} noValidate>
      <div className={authFormStyles.field}>
        <label htmlFor="name" className={authFormStyles.label}>
          Enter full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Amina Bello"
          className={authFormStyles.input}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

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
        label="Confirm password"
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

      {accountCreated && (
        <div className="flex justify-center">
          <Badge
            variant="success"
            role="status"
            aria-live="polite"
            data-icon="inline-start"
          >
            <CheckCircle2 aria-hidden="true" />
            Account created successfully
          </Badge>
        </div>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        disabled={!isValid}
        className={authFormStyles.submit}
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
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
          "-mt-3"
        )}
      >
        <span>Already have an account? </span>
        <Link href="/auth/login" className={authFormStyles.footerLink}>
          Sign In
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