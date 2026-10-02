import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email/mailer";
import { nanoid } from "nanoid";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: { message: issue?.message ?? "Invalid input" } },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      const resetToken = nanoid(32);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

      // Dispatch password reset email via Nodemailer
      void sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? "Customer",
        resetLink,
      });
    }

    // Always return safe generic success response to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists for this email, password reset instructions have been sent.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Auth] Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "An unexpected error occurred. Please try again later." },
      },
      { status: 500 }
    );
  }
}
