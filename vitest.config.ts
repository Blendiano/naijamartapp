import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // The live SMTP test talks to a real mail server and is excluded here so
    // that `npm test` never delivers real email. Run it with `npm run test:email`.
    exclude: ["node_modules/**", "e2e/**", "src/tests/email-live.test.ts"],
  },
});
