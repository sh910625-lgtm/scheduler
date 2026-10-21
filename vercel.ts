import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // 배포마다 DB 마이그레이션을 먼저 적용
  buildCommand: "npm run db:migrate && npm run build",
  crons: [
    // 매일 09:00 KST(00:00 UTC) 전체 사용자 증분 동기화. Hobby 플랜은 하루 1회까지 가능
    { path: "/api/cron/sync", schedule: "0 0 * * *" },
  ],
};
