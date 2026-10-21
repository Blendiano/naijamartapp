import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth.js
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url().optional(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1, "PAYSTACK_PUBLIC_KEY is required"),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),

  // Email (Nodemailer + SMTP)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  EMAIL_FROM: z.string().email().default("noreply@naijamart.ng"),

  // How long an email-verification link stays valid, in minutes.
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5, "Verification links must stay valid for at least 5 minutes")
    .default(15),

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_LIVE_CHAT_URL: z.string().url().optional(),

  // Abuse protection
  TRUSTED_PROXY: z.enum(["vercel", "forwarded", "direct"]).optional(),
  TRUSTED_PROXY_HOPS: z.coerce.number().int().positive().default(1),

  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
    .join("\n");
  throw new Error(
    `❌ Invalid environment variables:\n${missing}\n\nCheck your .env.local file.`
  );
}
