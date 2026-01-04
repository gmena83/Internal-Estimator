import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: import.meta.dirname,
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts", "client/src/**/*.tsx", "shared/**/*.ts"],
      exclude: ["node_modules", "**/*.d.ts", "tests/**/*"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
      "@assets": path.resolve(import.meta.dirname, "./attached_assets"),
    },
  },
});
