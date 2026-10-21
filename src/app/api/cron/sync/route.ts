import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { syncUser } from "@/server/google/sync.service";

/** 연동된 모든 사용자의 캘린더를 증분 동기화 (크론에서 호출) */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await db
    .selectDistinct({ userId: accounts.userId })
    .from(accounts)
    .where(eq(accounts.provider, "google"));

  const failed: { userId: string; error: string }[] = [];
  for (const { userId } of rows) {
    try {
      await syncUser(userId);
    } catch (e) {
      failed.push({ userId, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return Response.json({ synced: rows.length - failed.length, failed });
}
