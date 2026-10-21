import "server-only";
import { and, asc, eq, gt, inArray, lt, max } from "drizzle-orm";
import { db } from "@/server/db";
import { calendars, events, users } from "@/server/db/schema";
import { addDays, allDayKeys, dateKey, dayRange } from "@/lib/datetime";

export type DayEvent = {
  id: string;
  title: string;
  location: string | null;
  meetUrl: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  calendarName: string;
  color: string | null;
};

export async function getUserTimeZone(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { timeZone: true } });
  return user?.timeZone ?? "Asia/Seoul";
}

/** [fromKey, toKey] 날짜 범위(사용자 시간대)에 걸친 사용 중 캘린더의 일정 */
async function eventsBetween(userId: string, fromKey: string, toKey: string, timeZone: string, calendarId?: string) {
  // 종일 일정은 UTC 자정 기준이라 앞뒤로 하루씩 여유를 두고 조회한 뒤 날짜 키로 거른다
  const from = dayRange(addDays(fromKey, -1), timeZone).start;
  const to = dayRange(addDays(toKey, 1), timeZone).end;

  return db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      meetUrl: events.meetUrl,
      startAt: events.startAt,
      endAt: events.endAt,
      allDay: events.allDay,
      calendarName: calendars.summary,
      color: calendars.color,
    })
    .from(events)
    .innerJoin(calendars, eq(events.calendarId, calendars.id))
    .where(
      and(
        eq(calendars.userId, userId),
        eq(calendars.enabled, true),
        calendarId ? eq(calendars.id, calendarId) : undefined,
        gt(events.endAt, from),
        lt(events.startAt, to),
      ),
    )
    .orderBy(asc(events.startAt));
}

/** 일정이 표시될 날짜 키들 — 종일 일정은 걸친 모든 날, 시간 일정은 겹치는 모든 날 */
function keysOf(e: Pick<DayEvent, "allDay" | "startAt" | "endAt">, timeZone: string) {
  if (e.allDay) return allDayKeys(e.startAt, e.endAt);
  const keys = [dateKey(e.startAt, timeZone)];
  const last = dateKey(new Date(e.endAt.getTime() - 1), timeZone);
  while (keys.at(-1)! < last) keys.push(addDays(keys.at(-1)!, 1));
  return keys;
}

/** 하루치 일정 — 종일 일정 먼저, 그다음 시작 시간 순 */
export async function getDayEvents(userId: string, key: string, timeZone: string, calendarId?: string) {
  const rows = await eventsBetween(userId, key, key, timeZone, calendarId);
  return rows
    .filter((e) => keysOf(e, timeZone).includes(key))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startAt.getTime() - b.startAt.getTime());
}

/** 월간 그리드용: 날짜 키 → 그날 일정이 있는 캘린더 색상(최대 4개) */
export async function getMonthDots(userId: string, fromKey: string, toKey: string, timeZone: string, calendarId?: string) {
  const rows = await eventsBetween(userId, fromKey, toKey, timeZone, calendarId);
  const dots = new Map<string, string[]>();
  for (const e of rows) {
    const color = e.color ?? "#727785";
    for (const k of keysOf(e, timeZone)) {
      const list = dots.get(k) ?? [];
      if (!list.includes(color) && list.length < 4) list.push(color);
      dots.set(k, list);
    }
  }
  return dots;
}

export async function getUserCalendars(userId: string) {
  return db.query.calendars.findMany({
    where: eq(calendars.userId, userId),
    orderBy: [asc(calendars.summary)],
  });
}

/** 일정을 만들 수 있는(쓰기 권한이 있는) 캘린더 — 기본 캘린더 먼저 */
export async function getWritableCalendars(userId: string) {
  const rows = await db.query.calendars.findMany({
    where: and(eq(calendars.userId, userId), inArray(calendars.accessRole, ["owner", "writer"])),
  });
  return rows.sort((a, b) => Number(b.primary) - Number(a.primary) || a.summary.localeCompare(b.summary));
}

/** 사용 중 캘린더의 가장 최근 동기화 시각 */
export async function getLastSyncedAt(userId: string) {
  const [row] = await db
    .select({ at: max(calendars.lastSyncedAt) })
    .from(calendars)
    .where(and(eq(calendars.userId, userId), eq(calendars.enabled, true)));
  return row?.at ?? null;
}
