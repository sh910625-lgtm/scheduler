import { zonedTime } from "@/lib/datetime";

type TimedEvent = { allDay: boolean; startAt: Date; endAt: Date };

export type EventState = "done" | "now" | "soon" | "later";

/** "곧 시작" 표시 기준 */
const SOON_MS = 60 * 60_000;

/** 여유 시간 계산에 쓰는 업무 시간 */
export const WORK_HOURS = { start: "09:00", end: "18:00" } as const;

export function eventState(e: TimedEvent, now: Date): EventState {
  if (e.allDay) return "later";
  if (e.endAt <= now) return "done";
  if (e.startAt <= now) return "now";
  return e.startAt.getTime() - now.getTime() <= SOON_MS ? "soon" : "later";
}

/**
 * 오늘 일정 요약.
 * - next: 진행 중인 일정, 없으면 다음에 시작할 시간 일정
 * - freeMs: 지금(또는 업무 시작)부터 업무 종료까지 일정이 없는 시간
 */
export function summarizeDay<T extends TimedEvent>(events: T[], now: Date, todayKey: string, timeZone: string) {
  const timed = events.filter((e) => !e.allDay);
  const next = timed.find((e) => eventState(e, now) === "now") ?? timed.find((e) => e.startAt > now) ?? null;
  const remaining = events.filter((e) => e.allDay || e.endAt > now).length;

  const workStart = zonedTime(todayKey, WORK_HOURS.start, timeZone).getTime();
  const workEnd = zonedTime(todayKey, WORK_HOURS.end, timeZone).getTime();
  const from = Math.max(workStart, now.getTime());

  let freeMs = 0;
  let cursor = from;
  const busy = timed
    .map((e) => [Math.max(e.startAt.getTime(), from), Math.min(e.endAt.getTime(), workEnd)] as const)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  for (const [s, e] of busy) {
    if (s > cursor) freeMs += s - cursor;
    cursor = Math.max(cursor, e);
  }
  if (workEnd > cursor) freeMs += workEnd - cursor;

  return { next, remaining, total: events.length, freeMs };
}
