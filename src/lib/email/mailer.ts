import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "orders@naijamart.ng";

export interface OrderConfirmationEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderTotal: string; // Pre-formatted ₦ amount
  orderItems: Array<{
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
  deliveryAddress: string;
  deliveryOption: string;
}

/**
 * Send an order confirmation email.
 * Failures are logged and do not throw — email must not roll back a confirmed order.
 */
export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData
): Promise<void> {
  try {
    const transporter = createTransporter();

    const itemsHtml = data.orderItems
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #E4E0D8;">${item.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #E4E0D8;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #E4E0D8;text-align:right;">${item.unitPrice}</td>
          </tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — NaijaMart</title>
</head>
<body style="margin:0;padding:0;background:#F8F6F1;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:#174A45;padding:32px 40px;">
      <h1 style="margin:0;color:#F8F6F1;font-size:24px;font-weight:700;letter-spacing:-0.5px;">NaijaMart</h1>
      <p style="margin:8px 0 0;color:rgba(248,246,241,0.8);font-size:14px;">Your order has been confirmed</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="color:#1e3c39;font-size:16px;">Hi ${data.customerName},</p>
      <p style="color:#4a5568;font-size:15px;line-height:1.6;">
        Great news! Your order <strong style="color:#174A45;">${data.orderNumber}</strong> has been confirmed and is being processed.
      </p>

      <!-- Order Summary -->
      <div style="background:#F8F6F1;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="margin:0 0 16px;color:#174A45;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Order Summary</h2>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;font-size:12px;color:#6F8F88;padding:0 0 8px;border-bottom:2px solid #E4E0D8;">Item</th>
              <th style="text-align:center;font-size:12px;color:#6F8F88;padding:0 0 8px;border-bottom:2px solid #E4E0D8;">Qty</th>
              <th style="text-align:right;font-size:12px;color:#6F8F88;padding:0 0 8px;border-bottom:2px solid #E4E0D8;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:2px solid #E4E0D8;text-align:right;">
          <span style="font-size:18px;font-weight:700;color:#174A45;">${data.orderTotal}</span>
        </div>
      </div>

      <!-- Delivery -->
      <div style="margin:16px 0;">
        <p style="color:#4a5568;font-size:14px;"><strong>Delivery to:</strong> ${data.deliveryAddress}</p>
        <p style="color:#4a5568;font-size:14px;"><strong>Delivery method:</strong> ${data.deliveryOption}</p>
      </div>

      <p style="color:#4a5568;font-size:14px;line-height:1.6;">
        You can track your order at any time by visiting your 
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders" style="color:#174A45;text-decoration:none;font-weight:600;">order history</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#F8F6F1;border-top:1px solid #E4E0D8;">
      <p style="margin:0;color:#6F8F88;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} NaijaMart. Nigerian Fashion, Elevated.
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"NaijaMart" <${FROM_ADDRESS}>`,
      to: data.to,
      subject: `Order Confirmed — ${data.orderNumber}`,
      html,
    });
  } catch (error) {
    // Email failure must NOT roll back a confirmed order
    console.error("[Email] Failed to send order confirmation:", error);
  }
}

export interface WelcomeEmailData {
  to: string;
  name: string;
}

/**
 * Send a welcome notification email when a user creates an account.
 * Failures are caught and logged as non-blocking side effects.
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const transporter = createTransporter();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NaijaMart</title>
</head>
<body style="margin:0;padding:0;background:#F8F6F1;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:#174A45;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#F8F6F1;font-size:26px;font-weight:700;letter-spacing:-0.5px;">NaijaMart</h1>
      <p style="margin:8px 0 0;color:rgba(248,246,241,0.8);font-size:14px;">Elevated Nigerian Fashion</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="color:#1e3c39;font-size:16px;margin-top:0;">Hi ${data.name},</p>
      <h2 style="color:#174A45;font-size:20px;font-weight:700;margin:0 0 16px;letter-spacing:-0.3px;">Welcome to NaijaMart! 🎉</h2>

      <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 14px;">
        We're excited to have you here.
      </p>
      <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 14px;">
        Discover styles you'll love, explore fashion for every mood, and find your next
        favourite look — all in one place.
      </p>
      <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your NaijaMart journey starts now. ✨
      </p>

      <h3 style="color:#174A45;font-size:15px;font-weight:600;margin:0 0 20px;">Ready to explore?</h3>

      <div style="text-align:center;margin:0 0 32px;">
        <a href="${appUrl}/products" style="background:#174A45;color:#F8F6F1;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Start Shopping
        </a>
      </div>

      <p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0 0 4px;">Thank you for joining us,</p>
      <p style="color:#1e3c39;font-size:15px;font-weight:600;margin:0 0 16px;">The NaijaMart Team</p>
      <p style="color:#6F8F88;font-size:13px;font-style:italic;margin:0;">Nigerian Fashion, Elevated.</p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#F8F6F1;border-top:1px solid #E4E0D8;text-align:center;">
      <p style="margin:0;color:#6F8F88;font-size:12px;">
        © ${new Date().getFullYear()} NaijaMart. Nigerian Fashion, Elevated.
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"NaijaMart" <${FROM_ADDRESS}>`,
      to: data.to,
      subject: `Welcome to NaijaMart, ${data.name}!`,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
  }
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetLink: string;
}

/**
 * Send a password reset instruction email.
 * Failures are caught and logged gracefully.
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  try {
    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — NaijaMart</title>
</head>
<body style="margin:0;padding:0;background:#F8F6F1;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:#174A45;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#F8F6F1;font-size:26px;font-weight:700;letter-spacing:-0.5px;">NaijaMart</h1>
      <p style="margin:8px 0 0;color:rgba(248,246,241,0.8);font-size:14px;">Password Reset Request</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="color:#1e3c39;font-size:16px;margin-top:0;">Hi ${data.name},</p>
      <p style="color:#4a5568;font-size:15px;line-height:1.6;">
        We received a request to reset your password for your NaijaMart account. Click the button below to choose a new password:
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${data.resetLink}" style="background:#174A45;color:#F8F6F1;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
          Reset Password
        </a>
      </div>

      <p style="color:#4a5568;font-size:14px;line-height:1.6;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
      <p style="color:#6F8F88;font-size:13px;word-break:break-all;">
        Button not working? Copy and paste this link into your browser:<br/>
        <a href="${data.resetLink}" style="color:#174A45;">${data.resetLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;background:#F8F6F1;border-top:1px solid #E4E0D8;text-align:center;">
      <p style="margin:0;color:#6F8F88;font-size:12px;">
        © ${new Date().getFullYear()} NaijaMart. Nigerian Fashion, Elevated.
      </p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"NaijaMart Security" <${FROM_ADDRESS}>`,
      to: data.to,
      subject: "Reset your NaijaMart password",
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error);
  }
}

