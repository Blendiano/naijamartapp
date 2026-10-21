/**
 * Runs the live SMTP test.
 *
 * The test itself lives in `src/tests/email-live.test.ts` and is skipped
 * during a normal `npm test` run, because it delivers real email. This wrapper
 * loads the project's environment (`.env` + `.env.local`), flips the opt-in
 * flag and runs vitest with the live-only configuration.
 *
 * Usage:
 *   npm run test:email
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { loadProjectEnv } from "./lib/read-env-file.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

const env = loadProjectEnv(projectRoot);

if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
  console.error(
    "SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set in .env.local to run the live mail test."
  );
  process.exit(1);
}

const recipient = env.EMAIL_TEST_RECIPIENT ?? env.SMTP_USER;
console.log(`Sending test emails to ${recipient} via ${env.SMTP_HOST}.`);

const vitestBin = path.join(
  projectRoot,
  "node_modules",
  "vitest",
  "vitest.mjs"
);

const child = spawn(
  process.execPath,
  [vitestBin, "run", "--config", "vitest.live.config.ts"],
  {
    cwd: projectRoot,
    env: {
      ...env,
      RUN_LIVE_EMAIL_TESTS: "1",
      EMAIL_TEST_RECIPIENT: recipient,
    },
    stdio: "inherit",
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
