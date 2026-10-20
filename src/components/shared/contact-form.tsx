"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  orderNumber: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(3000, "Message must be under 3,000 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(values: ContactFormValues) {
    setStatus("loading");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = (await res.json()) as
        | { success: true }
        | { success: false; error: { message: string } };

      if (!res.ok || !json.success) {
        const msg =
          !json.success && json.error?.message
            ? json.error.message
            : "Something went wrong. Please try again or email us directly.";
        setServerError(msg);
        setStatus("error");
        return;
      }

      setStatus("success");
      reset();
    } catch {
      setServerError(
        "Something went wrong. Please try again or email us directly."
      );
      setStatus("error");
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition disabled:opacity-50";

  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  const errorClass = "mt-1 text-xs text-destructive";

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(152,55%,34%)]/10">
          <CheckCircle
            className="h-7 w-7 text-[hsl(152,55%,34%)]"
            aria-hidden="true"
          />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">Message sent</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll get back to you as soon as possible.
          </p>
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm text-primary font-medium hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
      aria-label="Contact form"
    >
      {status === "error" && serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Full name */}
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Full name <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Amara Okonkwo"
            className={fieldClass}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id="contact-name-error" className={errorClass} role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email address <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="contact-email-error" className={errorClass} role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Order number */}
        <div>
          <label htmlFor="contact-order" className={labelClass}>
            Order number{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="contact-order"
            type="text"
            placeholder="e.g. NM-2024-001"
            className={fieldClass}
            {...register("orderNumber")}
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="contact-subject" className={labelClass}>
            Subject <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-subject"
            type="text"
            placeholder="e.g. Question about my order"
            className={fieldClass}
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? "contact-subject-error" : undefined}
            {...register("subject")}
          />
          {errors.subject && (
            <p id="contact-subject-error" className={errorClass} role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message <span className="text-destructive" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder="Tell us how we can help…"
          className={`${fieldClass} resize-none leading-relaxed`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p id="contact-message-error" className={errorClass} role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      <div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="gap-2"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
