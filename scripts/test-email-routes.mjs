/**
 * End-to-end mail route test.
 *
 * Boots the application against a local SMTP capture server and drives the
 * real HTTP routes, then asserts what NaijaMart actually put in each email:
 *
 *   POST /api/auth/signup           → welcome email + verification email
 *   POST /api/auth/verify-email     → a fresh verification email
 *   GET  /api/auth/verify-email     → the link actually verifies the account
 *   POST /api/auth/forgot-password  → password reset email
 *   POST /api/contact               → contact form email
 *
 * Usage:
 *   npm run test:email-routes
 *   node scripts/test-email-routes.mjs --base-url https://naijamart.vercel.app
 *
 * With `--base-url` the routes of an already-running deployment are tested
 * instead of a locally started server.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { startCaptureServer } from "./lib/capture-smtp-server.mjs";
import { loadProjectEnv } from "./lib/read-env-file.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

/* ── Arguments ─────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf("--base-url");
const externalBaseUrl = baseUrlIndex !== -1 ? args[baseUrlIndex + 1] : null;
const port = Number(process.env.EMAIL_TEST_PORT ?? 3111);

/* ── Reporting ─────────────────────────────────────────────────────────── */

const results = [];
let failures = 0;

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures += 1;
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n${title}`);
}

/* ── Environment ───────────────────────────────────────────────────────── */

const env = loadProjectEnv(projectRoot);

if (!env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local before running this test."
  );
  process.exit(1);
}

/* ── Database helpers ──────────────────────────────────────────────────── */

const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

/* ── Server ────────────────────────────────────────────────────────────── */

let child = null;
let capture = null;
let baseUrl = externalBaseUrl;

async function startServer() {
  const nextBin = path.join(
    projectRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next"
  );

  const childEnv = {
    ...env,
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(capture.port),
    SMTP_USER: "capture@example.com",
    SMTP_PASSWORD: "capture-password",
    EMAIL_FROM: "capture@example.com",
    NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
    // A separate output directory: Next.js refuses to start a second dev
    // server that shares the dist directory with a running one.
    NEXT_DIST_DIR: ".next-email-test",
    NODE_ENV: "development",
  };

  child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: projectRoot,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const log = (stream, prefix) => {
    stream.setEncoding("utf8");
    stream.on("data", (data) => {
      if (process.env.EMAIL_TEST_VERBOSE === "1") {
        console.log(`[${prefix}] ${data.trimEnd()}`);
      }
    });
  };
  log(child.stdout, "next");
  log(child.stderr, "next");

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 120000;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/api/auth/csrf`, {
        redirect: "manual",
      });
      if (res.status < 500) {
        baseUrl = url;
        return;
      }
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("The application did not start in time");
}

function stopServer() {
  if (child && !child.killed) {
    child.kill();
  }
}

/* ── HTTP helpers ──────────────────────────────────────────────────────── */

function cookieJarFrom(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  return cookies
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function signIn(email, password) {
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfBody = await csrfRes.json();
  const csrfCookie = cookieJarFrom(csrfRes);

  const form = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
    callbackUrl: `${baseUrl}/store`,
    json: "true",
  });

  const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: form.toString(),
    redirect: "manual",
  });

  return cookieJarFrom(res);
}

/* ── Message helpers ───────────────────────────────────────────────────── */

/**
 * Finds a URL inside a captured message.
 *
 * The body is quoted-printable encoded, so the raw message contains soft line
 * breaks inside long URLs. The decoded text is searched first.
 */
function findLink(message, pattern) {
  for (const source of [message.text, message.raw]) {
    const match = source.match(pattern);
    if (match) return match[0];
  }
  return null;
}

/* ── Test run ──────────────────────────────────────────────────────────── */

const stamp = Date.now();
const testEmail = `mail-test-${stamp}@example.com`;
const testPassword = "NaijaMart1!";
const testName = "Mail Route Test";
const testStartedAt = new Date();

const VERIFICATION_SUBJECT = "Verify your email";

capture = await startCaptureServer();

if (!externalBaseUrl) {
  section("Starting the application");
  await startServer();
  console.log(`  application listening on ${baseUrl}`);
} else {
  baseUrl = externalBaseUrl;
  section(`Testing the running deployment at ${baseUrl}`);
  console.log(
    "  note: the capture server is not used, so only the API responses are checked"
  );
}

let createdUserId = null;
let firstLink = null;

try {
  section("POST /api/auth/signup");
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  const signupBody = await signupRes.json();

  record(
    "signup returns 201",
    signupRes.status === 201,
    `status ${signupRes.status}`
  );
  record(
    "signup reports the verification email as delivered",
    signupBody.verificationEmailSent === true,
    JSON.stringify(signupBody.verificationEmailSent ?? signupBody.error ?? {})
  );
  createdUserId = signupBody?.data?.id ?? null;

  if (capture) {
    const welcome = await capture.waitForMessage((m) =>
      m.subject.includes("Welcome to NaijaMart")
    );
    record("welcome email was sent", Boolean(welcome), welcome.subject);

    const verification = await capture.waitForMessage((m) =>
      m.subject.includes(VERIFICATION_SUBJECT)
    );
    record("verification email was sent", Boolean(verification), verification.subject);

    firstLink = verification
      ? findLink(
          verification,
          /https?:\/\/[^\s"'<>]*\/api\/auth\/verify-email\?token=[a-f0-9]+/
        )
      : null;
    record(
      "verification email contains a verification link",
      Boolean(firstLink),
      firstLink ?? "no link found in the captured message"
    );
    record(
      "verification link points at the deployed origin",
      firstLink ? firstLink.startsWith(baseUrl) : false,
      firstLink ?? ""
    );
  }

  // The resend happens before the account is verified: a resent link must be
  // issued without invalidating the link that is already in the inbox.
  section("POST /api/auth/verify-email (resend)");
  const sessionCookie = await signIn(testEmail, testPassword);
  record("the test account can sign in", sessionCookie.length > 0);

  const beforeResend = capture.messages.length;

  const resendRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const resendBody = await resendRes.json();
  record(
    "resend returns 200",
    resendRes.status === 200,
    `status ${resendRes.status} ${JSON.stringify(resendBody.error ?? "")}`
  );
  record(
    "resend reports the email as sent",
    resendBody.success === true,
    resendBody.message ?? ""
  );

  if (capture) {
    const resent = await capture.waitForNewMessage(
      (m) => m.subject.includes(VERIFICATION_SUBJECT),
      beforeResend
    );
    record("a second verification email was sent", Boolean(resent), resent.subject);

    const resentLink = resent
      ? findLink(
          resent,
          /https?:\/\/[^\s"'<>]*\/api\/auth\/verify-email\?token=[a-f0-9]+/
        )
      : null;
    record(
      "the resent email contains a different verification link",
      Boolean(resentLink) && resentLink !== firstLink,
      resentLink ?? "no link found in the captured message"
    );
  }

  section("GET /api/auth/verify-email");
  if (firstLink) {
    // The link that was sent before the resend still has to work.
    const verifyRes = await fetch(firstLink, { redirect: "manual" });
    const location = verifyRes.headers.get("location") ?? "";
    record(
      "the original verification link still confirms the account",
      verifyRes.status === 302 && location.includes("status=success"),
      `status ${verifyRes.status} → ${location}`
    );

    const [row] = await sql`
      SELECT email_verified FROM users WHERE id = ${createdUserId}
    `;
    record(
      "the account is marked as verified in the database",
      Boolean(row?.email_verified),
      row?.email_verified ? String(row.email_verified) : "not verified"
    );
  }

  section("POST /api/auth/forgot-password");
  const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotBody = await forgotRes.json();
  record(
    "forgot-password returns a generic 200",
    forgotRes.status === 200 && forgotBody.success === true,
    `status ${forgotRes.status}`
  );

  if (capture) {
    const reset = await capture.waitForMessage((m) =>
      m.subject.includes("Reset your NaijaMart password")
    );
    record("password reset email was sent", Boolean(reset), reset.subject);

    const resetLink = reset
      ? findLink(
          reset,
          /https?:\/\/[^\s"'<>]*\/auth\/reset-password\?token=[A-Za-z0-9_-]+/
        )
      : null;
    record(
      "password reset email contains a reset link",
      Boolean(resetLink),
      resetLink ?? "no link found in the captured message"
    );
    record(
      "password reset link points at the deployed origin",
      resetLink ? resetLink.startsWith(baseUrl) : false,
      resetLink ?? ""
    );
  }

  section("POST /api/contact");
  const contactRes = await fetch(`${baseUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: testName,
      email: testEmail,
      subject: "Mail route test",
      message: "This message was sent by the mail route test.",
    }),
  });
  const contactBody = await contactRes.json();
  record(
    "contact form returns 200",
    contactRes.status === 200 && contactBody.success === true,
    `status ${contactRes.status} ${JSON.stringify(contactBody.error ?? "")}`
  );

  if (capture) {
    const contact = await capture.waitForMessage((m) =>
      m.subject.includes("[Contact]")
    );
    record("contact form email was sent", Boolean(contact), contact.subject);
    record(
      "contact form email keeps the sender as reply-to",
      contact.raw.includes(testEmail),
      ""
    );
  }
} catch (error) {
  record("test run", false, error instanceof Error ? error.message : String(error));
} finally {
  section("Cleanup");
  if (capture) {
    if (process.env.EMAIL_TEST_DUMP === "1") {
      for (const message of capture.messages) {
        const index = message.raw.indexOf("127.0");
        console.log(
          `  dump ${JSON.stringify(message.subject)}: ${JSON.stringify(
            message.raw.slice(Math.max(0, index - 60), index + 60)
          )}`
        );
      }
    }
    console.log(
      `  captured ${capture.messages.length} message(s): ${capture.messages
        .map((m) => JSON.stringify(m.subject))
        .join(", ")}`
    );
  }
  if (createdUserId) {
    await sql`DELETE FROM verification_tokens WHERE identifier = ${createdUserId}`;
    await sql`DELETE FROM sessions WHERE user_id = ${createdUserId}`;
    // Only the counters this run opened, so an unrelated counter in the
    // shared database is left alone.
    await sql`DELETE FROM rate_limits WHERE window_started_at >= ${testStartedAt}`;
    await sql`DELETE FROM users WHERE id = ${createdUserId}`;
    console.log(`  removed the test account ${testEmail}`);
  }
  stopServer();
  if (capture) await capture.close();
}

console.log("\n─────────────────────────────");
console.log(
  `${results.filter((r) => r.ok).length}/${results.length} checks passed`
);
if (failures > 0) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All mail routes delivered as expected.");
process.exit(0);
