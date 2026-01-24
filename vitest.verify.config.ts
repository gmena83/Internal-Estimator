import { defineConfig } from "vitest/config";
import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["apps/api/tests/**/*.test.ts"],
    testTimeout: 120000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@shared": path.resolve(__dirname, "./packages/shared/src"),
      "@internal/shared": path.resolve(__dirname, "./packages/shared/src/schema.ts"),
    },
  },
});
