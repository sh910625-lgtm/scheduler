import { describe, expect, it } from "vitest";
import { eventState, summarizeDay } from "@/features/events/briefing";

const TZ = "Asia/Seoul";
const DAY = "2026-10-21";
// 서울 시각 "HH:mm" → Date
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00+09:00`);
const ev = (start: string, end: string, allDay = false) => ({ startAt: at(start), endAt: at(end), allDay });

describe("eventState", () => {
  const now = at("10:00");
  it("classifies done / now / soon / later", () => {
    expect(eventState(ev("08:00", "09:00"), now)).toBe("done");
    expect(eventState(ev("09:30", "10:30"), now)).toBe("now");
    expect(eventState(ev("10:45", "11:00"), now)).toBe("soon");
    expect(eventState(ev("13:00", "14:00"), now)).toBe("later");
    expect(eventState(ev("00:00", "00:00", true), now)).toBe("later");
  });
});

describe("summarizeDay", () => {
  it("picks the ongoing event as next and counts free work time", () => {
    const events = [ev("09:00", "10:00"), ev("10:30", "11:30"), ev("11:00", "12:00"), ev("14:00", "15:30")];
    const s = summarizeDay(events, at("10:15"), DAY, TZ);
    expect(s.next).toBe(events[1]);
    expect(s.total).toBe(4);
    expect(s.remaining).toBe(3);
    // 10:15–18:00 = 465분, 바쁨 10:30–12:00(겹침 병합 90분) + 14:00–15:30(90분) → 285분
    expect(s.freeMs).toBe(285 * 60_000);
  });

  it("picks the ongoing event when one is in progress", () => {
    const events = [ev("09:00", "11:00"), ev("13:00", "14:00")];
    expect(summarizeDay(events, at("10:00"), DAY, TZ).next).toBe(events[0]);
  });

  it("returns no next event and zero free time after work hours", () => {
    const s = summarizeDay([ev("09:00", "10:00")], at("19:00"), DAY, TZ);
    expect(s.next).toBeNull();
    expect(s.remaining).toBe(0);
    expect(s.freeMs).toBe(0);
  });

  it("all-day events count as remaining but not as busy time", () => {
    const s = summarizeDay([ev("00:00", "00:00", true)], at("08:00"), DAY, TZ);
    expect(s.remaining).toBe(1);
    expect(s.freeMs).toBe(9 * 60 * 60_000);
  });
});
