import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/generated/**"],
    },
  },
  resolve: {
    alias: {
      "@nextpress/db": path.resolve(__dirname, "../db/src"),
      "@nextpress/blocks": path.resolve(__dirname, "../blocks/src"),
    },
  },
});
