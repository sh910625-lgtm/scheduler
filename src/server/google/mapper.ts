import type { calendar_v3 } from "googleapis";
import type { events } from "@/server/db/schema";

export type GoogleEvent = calendar_v3.Schema$Event;
export type EventRow = typeof events.$inferInsert;

/**
 * Google 이벤트 → event 테이블 row.
 * 종일 일정(start.date)은 해당 날짜의 UTC 자정으로 저장하고 allDay=true로 표시한다.
 * (end.date는 Google 규칙대로 "다음 날"이므로 exclusive)
 */
export function toEventRow(calendarId: string, e: GoogleEvent): EventRow | null {
  if (!e.id || !e.start || !e.end) return null;
  const startAt = parseEventTime(e.start);
  const endAt = parseEventTime(e.end);
  if (!startAt || !endAt) return null;

  return {
    calendarId,
    googleEventId: e.id,
    recurringEventId: e.recurringEventId ?? null,
    title: e.summary ?? "",
    description: e.description ?? null,
    location: e.location ?? null,
    meetUrl: e.hangoutLink ?? e.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ?? null,
    startAt,
    endAt,
    allDay: !e.start.dateTime,
    status: e.status ?? "confirmed",
    etag: e.etag ?? null,
    updatedAt: new Date(),
  };
}

function parseEventTime(t: calendar_v3.Schema$EventDateTime): Date | null {
  if (t.dateTime) return new Date(t.dateTime);
  if (t.date) return new Date(`${t.date}T00:00:00Z`);
  return null;
}
