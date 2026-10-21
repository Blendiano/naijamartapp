import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactFormEmail } from "@/lib/email/mailer";
import { getClientIp } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  RATE_LIMIT_POLICIES,
  RATE_LIMIT_SCOPES,
} from "@/lib/security/rate-limit";
import { BODY_LIMITS, readJsonBody } from "@/lib/security/body";
import { tooManyRequests } from "@/lib/security/http";
import { handleRouteError } from "@/lib/api-routes";

const contactSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid email address"),
    orderNumber: z
      .string()
      .max(50)
      .optional()
      .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined)),
    subject: z
      .string()
      .min(3, "Subject must be at least 3 characters")
      .max(200),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(3000),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    // Sends mail to the store inbox, so it is limited per IP.
    const limit = await consumeRateLimit({
      scope: RATE_LIMIT_SCOPES.contactIp,
      key: getClientIp(req.headers),
      policy: RATE_LIMIT_POLICIES.contactIp,
    });
    if (!limit.allowed) {
      return tooManyRequests(
        limit,
        "Too many messages have been sent from this connection."
      );
    }

    const body = await readJsonBody(req, BODY_LIMITS.medium);
    if (!body.ok) return body.response;

    const parsed = contactSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Please check the form fields and try again.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const delivery = await sendContactFormEmail(parsed.data);

    if (!delivery.delivered) {
      // The message was not accepted by the mail server, so it has not been
      // sent. Say so instead of reporting a success that never arrived.
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              delivery.reason ??
              "We could not send your message right now. Please try again shortly.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError(
      error,
      "[Contact] Failed to process contact form",
      "Something went wrong. Please try again or email us directly.",
      500
    );
  }
}
