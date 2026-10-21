import { defineConfig } from "drizzle-kit";

// Next.js와 같은 .env.local을 사용
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
