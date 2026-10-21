import "server-only";
import { getCalendarClient } from "./client";

/** 사용자가 접근 가능한 Google 캘린더 목록 */
export async function listGoogleCalendars(userId: string) {
  const calendar = await getCalendarClient(userId);
  const res = await calendar.calendarList.list({ minAccessRole: "reader" });
  return res.data.items ?? [];
}
