import "server-only";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { calendars, events, users } from "@/server/db/schema";
import { allDayKeys, dateKey, nextDateKeys } from "@/lib/datetime";

export type AgendaEvent = {
  id: string;
  title: string;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  color: string | null;
};

export type AgendaDay = { key: string; events: AgendaEvent[] };

/** 오늘부터 days일 동안의 일정을 사용자 시간대 기준 날짜별로 묶어 반환 */
export async function getAgenda(userId: string, days = 14) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { timeZone: true } });
  const timeZone = user?.timeZone ?? "Asia/Seoul";

  const now = new Date();
  const keys = nextDateKeys(now, days, timeZone);
  // 시간대 차이를 감안해 앞뒤로 하루씩 여유를 두고 조회한 뒤 날짜 키로 거른다
  const from = new Date(`${keys[0]}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${keys.at(-1)}T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + 2);

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      location: events.location,
      startAt: events.startAt,
      endAt: events.endAt,
      allDay: events.allDay,
      color: calendars.color,
    })
    .from(events)
    .innerJoin(calendars, eq(events.calendarId, calendars.id))
    .where(
      and(
        eq(calendars.userId, userId),
        eq(calendars.enabled, true),
        gt(events.endAt, from),
        lt(events.startAt, to),
      ),
    )
    .orderBy(asc(events.allDay), asc(events.startAt));

  const byDay = new Map<string, AgendaEvent[]>(keys.map((k) => [k, []]));
  for (const e of rows) {
    // 종일 일정은 모든 해당 날짜에, 시간 일정은 시작 날짜에 표시
    const dayKeys = e.allDay ? allDayKeys(e.startAt, e.endAt) : [dateKey(e.startAt, timeZone)];
    for (const k of dayKeys) byDay.get(k)?.push(e);
  }
  // 종일 일정을 먼저, 그다음 시작 시간 순
  for (const list of byDay.values()) {
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startAt.getTime() - b.startAt.getTime());
  }

  return {
    timeZone,
    days: keys.map((key): AgendaDay => ({ key, events: byDay.get(key)! })),
  };
}

export async function getUserCalendars(userId: string) {
  return db.query.calendars.findMany({
    where: eq(calendars.userId, userId),
    orderBy: [asc(calendars.summary)],
  });
}
