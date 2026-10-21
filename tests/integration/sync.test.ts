import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { calendars, events, users } from "@/server/db/schema";
import { syncUser, type CalendarApi } from "@/server/google/sync.service";
import type { GoogleEvent } from "@/server/google/mapper";

type Page = { items: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string };

/** events.list 호출을 기록하고, 준비된 응답을 순서대로 돌려주는 가짜 Calendar API */
function fakeApi(opts: { calendarList: object[]; eventPages: (Page | Error)[] }) {
  const listCalls: Record<string, unknown>[] = [];
  const api = {
    calendarList: { list: async () => ({ data: { items: opts.calendarList } }) },
    events: {
      list: async (params: Record<string, unknown>) => {
        listCalls.push(params);
        const next = opts.eventPages.shift();
        if (!next) throw new Error("unexpected events.list call");
        if (next instanceof Error) throw next;
        return { data: next };
      },
    },
  } as unknown as CalendarApi;
  return { api, listCalls };
}

const primary = { id: "me@example.com", summary: "내 캘린더", primary: true, accessRole: "owner", backgroundColor: "#4285f4", timeZone: "Asia/Seoul" };
const other = { id: "holidays", summary: "공휴일", accessRole: "reader", backgroundColor: "#0b8043" };

const timed = (id: string, title: string): GoogleEvent => ({
  id,
  summary: title,
  status: "confirmed",
  start: { dateTime: "2026-10-22T10:00:00+09:00" },
  end: { dateTime: "2026-10-22T11:00:00+09:00" },
});

let userId: string;

beforeEach(async () => {
  await db.delete(users);
  [{ id: userId }] = await db.insert(users).values({ email: "me@example.com", timeZone: "UTC" }).returning();
});

afterAll(async () => {
  await db.delete(users);
});

const eventTitles = async () =>
  (await db.select({ title: events.title }).from(events)).map((r) => r.title).sort();

describe("syncUser", () => {
  it("full sync: stores calendars, enables only primary, saves events and syncToken", async () => {
    const { api, listCalls } = fakeApi({
      calendarList: [primary, other],
      eventPages: [
        { items: [timed("a", "A")], nextPageToken: "p2" },
        { items: [timed("b", "B")], nextSyncToken: "tok-1" },
      ],
    });

    await syncUser(userId, api);

    const cals = await db.select().from(calendars).orderBy(calendars.summary);
    expect(cals.map((c) => [c.summary, c.enabled, c.primary, c.accessRole])).toEqual([
      ["공휴일", false, false, "reader"],
      ["내 캘린더", true, true, "owner"],
    ]);
    expect(cals.find((c) => c.enabled)!.syncToken).toBe("tok-1");
    expect(await eventTitles()).toEqual(["A", "B"]);

    // 전체 동기화는 timeMin으로, 다음 페이지는 pageToken으로 요청
    expect(listCalls[0]).toMatchObject({ calendarId: "me@example.com", singleEvents: true });
    expect(listCalls[0].timeMin).toBeTypeOf("string");
    expect(listCalls[0].syncToken).toBeUndefined();
    expect(listCalls[1].pageToken).toBe("p2");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(user.timeZone).toBe("Asia/Seoul");
  });

  it("incremental sync: uses syncToken, applies updates and deletions", async () => {
    await syncUser(
      userId,
      fakeApi({ calendarList: [primary], eventPages: [{ items: [timed("a", "A"), timed("b", "B")], nextSyncToken: "tok-1" }] }).api,
    );

    const { api, listCalls } = fakeApi({
      calendarList: [primary],
      eventPages: [{ items: [timed("a", "A (수정)"), { id: "b", status: "cancelled" }, timed("c", "C")], nextSyncToken: "tok-2" }],
    });
    await syncUser(userId, api);

    expect(listCalls[0].syncToken).toBe("tok-1");
    expect(listCalls[0].timeMin).toBeUndefined();
    expect(await eventTitles()).toEqual(["A (수정)", "C"]);
    const [cal] = await db.select().from(calendars);
    expect(cal.syncToken).toBe("tok-2");
  });

  it("410 Gone: wipes local events and falls back to full sync", async () => {
    await syncUser(
      userId,
      fakeApi({ calendarList: [primary], eventPages: [{ items: [timed("old", "Old")], nextSyncToken: "tok-1" }] }).api,
    );

    const gone = Object.assign(new Error("Sync token is no longer valid"), { status: 410 });
    const { api, listCalls } = fakeApi({
      calendarList: [primary],
      eventPages: [gone, { items: [timed("new", "New")], nextSyncToken: "tok-fresh" }],
    });
    await syncUser(userId, api);

    expect(listCalls[0].syncToken).toBe("tok-1");
    expect(listCalls[1].syncToken).toBeUndefined();
    expect(listCalls[1].timeMin).toBeTypeOf("string");
    expect(await eventTitles()).toEqual(["New"]);
    const [cal] = await db.select().from(calendars);
    expect(cal.syncToken).toBe("tok-fresh");
  });

  it("keeps user's enabled choice and removes unsubscribed calendars", async () => {
    await syncUser(userId, fakeApi({ calendarList: [primary, other], eventPages: [{ items: [], nextSyncToken: "t" }] }).api);
    await db.update(calendars).set({ enabled: false }).where(eq(calendars.googleCalendarId, "me@example.com"));

    // 사용자가 기본 캘린더를 껐고, 공휴일 캘린더는 구독 해제됨
    await syncUser(userId, fakeApi({ calendarList: [primary], eventPages: [] }).api);

    const cals = await db.select().from(calendars);
    expect(cals.map((c) => [c.googleCalendarId, c.enabled])).toEqual([["me@example.com", false]]);
  });
});
