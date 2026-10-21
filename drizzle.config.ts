import { defineConfig } from "drizzle-kit";

// Next.js와 같은 .env.local을 사용
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  // 마이그레이션은 풀러를 거치지 않는 직접 연결 사용 (Neon은 DATABASE_URL_UNPOOLED 제공)
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)! },
});
