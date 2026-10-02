import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email/mailer";
import { getFirstUnmetRule, PASSWORD_RULE_MESSAGES } from "@/lib/auth/password-rules";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .regex(
        /^\S+(\s+\S+)+$/,
        "Enter both first and last name separated by a space"
      ),
    email: z.string().email("Please enter a valid email address"),
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: issue?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "An account with this email already exists." },
        },
        { status: 400 }
      );
    }

    // Hash password & create user
    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        role: "customer",
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    // Send welcome email as a non-blocking post-creation side effect
    if (newUser) {
      void sendWelcomeEmail({
        to: newUser.email,
        name: newUser.name ?? name,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        message: "Account created successfully.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "An unexpected error occurred. Please try again later." },
      },
      { status: 500 }
    );
  }
}
