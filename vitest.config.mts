import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Next.js 전용 가드 모듈은 테스트에서 빈 모듈로 대체
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/empty.ts"),
    },
  },
  test: {
    env: { DATABASE_URL: "postgres://postgres:postgres@localhost:5432/scheduler_test" },
    globalSetup: ["tests/setup/test-db.ts"],
    fileParallelism: false,
  },
});
