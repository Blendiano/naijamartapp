import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Configuration for the live SMTP test only.
 *
 * Kept apart from `vitest.config.ts` so that `npm test` never delivers real
 * email. `npm run test:email` runs this configuration.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
  test: {
    environment: "node",
    include: ["src/tests/email-live.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
