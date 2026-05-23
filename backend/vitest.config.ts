import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup/test-env.ts"],
    globalSetup: ["./tests/setup/global-setup.ts"],
    teardownTimeout: 10_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
