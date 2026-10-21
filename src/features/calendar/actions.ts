"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/server/db";
import { calendars } from "@/server/db/schema";
import { syncUser } from "@/server/google/sync.service";
import { getCurrentUser } from "@/server/session";

export async function syncNow() {
  const user = await getCurrentUser();
  await syncUser(user.id);
  refresh();
}

export async function setCalendarEnabled(calendarId: string, enabled: boolean) {
  const user = await getCurrentUser();
  const [updated] = await db
    .update(calendars)
    .set({ enabled })
    .where(and(eq(calendars.id, calendarId), eq(calendars.userId, user.id)))
    .returning({ id: calendars.id });
  if (!updated) throw new Error("캘린더를 찾을 수 없습니다.");

  // 새로 켠 캘린더의 일정을 바로 가져온다
  if (enabled) await syncUser(user.id);
  refresh();
}
