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
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "This field cannot be empty"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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

      toast.success("Account created successfully!");

      // Automatically sign in after creation
      const signinRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signinRes?.error) {
        router.push("/auth/login");
      } else {
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
        {errors.name?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.name.message}
          </p>
        )}
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
        {errors.email?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={authFormStyles.field}>
        <label htmlFor="password" className={authFormStyles.label}>
          Enter password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          className={authFormStyles.input}
          {...register("password")}
        />
        {errors.password?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className={authFormStyles.field}>
        <label htmlFor="confirmPassword" className={authFormStyles.label}>
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          className={authFormStyles.input}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message && (
          <p className={authFormStyles.error} role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {formError && (
        <p className={authFormStyles.alert} role="alert">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={authFormStyles.submit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating
            Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      <div className={authFormStyles.footer}>
        <span>Already have an account? </span>
        <Link href="/auth/login" className={authFormStyles.footerLink}>
          Sign In
        </Link>
      </div>
    </form>
  );
}