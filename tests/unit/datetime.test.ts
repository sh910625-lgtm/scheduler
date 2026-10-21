import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  allDayKeys,
  dateKey,
  dayRange,
  formatDuration,
  formatRelative,
  weekdayMonFirst,
  zonedTime,
} from "@/lib/datetime";

describe("datetime", () => {
  it("dateKey uses the given time zone", () => {
    const d = new Date("2026-10-21T16:30:00Z"); // 서울 기준 10월 22일 01:30
    expect(dateKey(d, "Asia/Seoul")).toBe("2026-10-22");
    expect(dateKey(d, "UTC")).toBe("2026-10-21");
  });

  it("addDays / addMonths cross boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("weekdayMonFirst is 0 for Monday and 6 for Sunday", () => {
    expect(weekdayMonFirst("2026-10-19")).toBe(0);
    expect(weekdayMonFirst("2026-10-25")).toBe(6);
  });

  it("zonedTime converts local wall time to UTC", () => {
    expect(zonedTime("2026-10-21", "09:00", "Asia/Seoul").toISOString()).toBe("2026-10-21T00:00:00.000Z");
    // 뉴욕 서머타임 해제 다음 날 (EST, UTC-5)
    expect(zonedTime("2026-11-02", "09:00", "America/New_York").toISOString()).toBe("2026-11-02T14:00:00.000Z");
  });

  it("dayRange spans one local day", () => {
    const { start, end } = dayRange("2026-10-21", "Asia/Seoul");
    expect(start.toISOString()).toBe("2026-10-20T15:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-21T15:00:00.000Z");
  });

  it("allDayKeys treats end as exclusive", () => {
    expect(allDayKeys(new Date("2026-10-21T00:00:00Z"), new Date("2026-10-23T00:00:00Z"))).toEqual([
      "2026-10-21",
      "2026-10-22",
    ]);
  });

  it("formats durations and relative times", () => {
    expect(formatDuration(25 * 60_000)).toBe("25분");
    expect(formatDuration(90 * 60_000)).toBe("1시간 30분");
    expect(formatDuration(120 * 60_000)).toBe("2시간");
    const now = new Date("2026-10-21T10:00:00Z");
    expect(formatRelative(new Date("2026-10-21T09:59:40Z"), now)).toBe("방금 전");
    expect(formatRelative(new Date("2026-10-21T09:15:00Z"), now)).toBe("45분 전");
    expect(formatRelative(new Date("2026-10-21T07:00:00Z"), now)).toBe("3시간 전");
  });
});
