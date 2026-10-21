import "server-only";
import type { calendar_v3 } from "googleapis";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { calendars, events, users } from "@/server/db/schema";
import { getCalendarClient } from "./client";
import { toEventRow, type EventRow, type GoogleEvent } from "./mapper";

export type CalendarApi = calendar_v3.Calendar;
type CalendarRow = typeof calendars.$inferSelect;

/** 최초 전체 동기화 시 가져올 과거 범위 */
const FULL_SYNC_PAST_DAYS = 365;

/**
 * 사용자의 캘린더 목록과, 사용 중인 모든 캘린더의 이벤트를 동기화한다.
 * api는 테스트에서 가짜 클라이언트를 넣을 때만 지정한다.
 */
export async function syncUser(userId: string, api?: CalendarApi) {
  api ??= await getCalendarClient(userId);
  await syncCalendarList(api, userId);

  const enabled = await db
    .select()
    .from(calendars)
    .where(and(eq(calendars.userId, userId), eq(calendars.enabled, true)));
  for (const cal of enabled) {
    await syncCalendarEvents(api, cal);
  }
}

async function syncCalendarList(api: CalendarApi, userId: string) {
  const items: calendar_v3.Schema$CalendarListEntry[] = [];
  let pageToken: string | undefined;
  do {
    const res = await api.calendarList.list({ minAccessRole: "reader", pageToken });
    items.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  const valid = items.filter((c): c is typeof c & { id: string } => !!c.id);
  if (valid.length === 0) return;

  await db
    .insert(calendars)
    .values(
      valid.map((c) => ({
        userId,
        googleCalendarId: c.id,
        summary: c.summaryOverride ?? c.summary ?? c.id,
        color: c.backgroundColor ?? null,
        // 처음 발견한 캘린더는 기본 캘린더만 켜 둔다
        enabled: !!c.primary,
      })),
    )
    .onConflictDoUpdate({
      target: [calendars.userId, calendars.googleCalendarId],
      set: { summary: sql`excluded.summary`, color: sql`excluded.color` },
    });

  // Google에서 구독 해제된 캘린더 정리
  await db.delete(calendars).where(
    and(
      eq(calendars.userId, userId),
      notInArray(
        calendars.googleCalendarId,
        valid.map((c) => c.id),
      ),
    ),
  );

  const primaryTz = valid.find((c) => c.primary)?.timeZone;
  if (primaryTz) {
    await db.update(users).set({ timeZone: primaryTz }).where(eq(users.id, userId));
  }
}

async function syncCalendarEvents(api: CalendarApi, cal: CalendarRow) {
  try {
    await runEventSync(api, cal);
  } catch (e) {
    if (!isSyncTokenExpired(e)) throw e;
    // syncToken 무효화(410) → 로컬 사본을 비우고 전체 동기화
    await db.delete(events).where(eq(events.calendarId, cal.id));
    await runEventSync(api, { ...cal, syncToken: null });
  }
}

async function runEventSync(api: CalendarApi, cal: CalendarRow) {
  const range = cal.syncToken
    ? { syncToken: cal.syncToken }
    : { timeMin: new Date(Date.now() - FULL_SYNC_PAST_DAYS * 86_400_000).toISOString() };

  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  do {
    const res = await api.events.list({
      calendarId: cal.googleCalendarId,
      singleEvents: true,
      showDeleted: true,
      maxResults: 2500,
      pageToken,
      ...range,
    });
    await applyEventChanges(cal.id, res.data.items ?? []);
    pageToken = res.data.nextPageToken ?? undefined;
    nextSyncToken = res.data.nextSyncToken ?? undefined;
  } while (pageToken);

  await db
    .update(calendars)
    .set({ syncToken: nextSyncToken ?? null, lastSyncedAt: new Date() })
    .where(eq(calendars.id, cal.id));
}

async function applyEventChanges(calendarId: string, items: GoogleEvent[]) {
  const cancelledIds = items.filter((e) => e.status === "cancelled" && e.id).map((e) => e.id!);
  const rows = items
    .filter((e) => e.status !== "cancelled")
    .map((e) => toEventRow(calendarId, e))
    .filter((r): r is EventRow => r !== null);

  if (cancelledIds.length > 0) {
    await db
      .delete(events)
      .where(and(eq(events.calendarId, calendarId), inArray(events.googleEventId, cancelledIds)));
  }
  if (rows.length > 0) {
    await db
      .insert(events)
      .values(rows)
      .onConflictDoUpdate({
        target: [events.calendarId, events.googleEventId],
        set: {
          recurringEventId: sql`excluded.recurring_event_id`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          location: sql`excluded.location`,
          startAt: sql`excluded.start_at`,
          endAt: sql`excluded.end_at`,
          allDay: sql`excluded.all_day`,
          status: sql`excluded.status`,
          etag: sql`excluded.etag`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }
}

function isSyncTokenExpired(e: unknown) {
  if (typeof e !== "object" || e === null) return false;
  const err = e as { status?: number; code?: number | string; response?: { status?: number } };
  return err.status === 410 || err.response?.status === 410 || Number(err.code) === 410;
}
