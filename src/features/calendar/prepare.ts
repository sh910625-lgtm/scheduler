import "server-only";
import { getMissingCalendarScopes } from "@/server/google/client";
import { syncUser } from "@/server/google/sync.service";
import { getUserCalendars } from "@/features/events/queries";

/**
 * 화면을 그리기 전 캘린더 연동 상태를 확인한다.
 * 권한이 빠졌으면 "reconnect", 첫 방문이면 전체 동기화를 한 번 실행한다.
 */
export async function prepareCalendar(userId: string): Promise<"ok" | "reconnect"> {
  if ((await getMissingCalendarScopes(userId)).length > 0) return "reconnect";
  if ((await getUserCalendars(userId)).length === 0) await syncUser(userId);
  return "ok";
}
