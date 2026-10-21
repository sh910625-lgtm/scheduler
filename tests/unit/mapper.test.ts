import { describe, expect, it } from "vitest";
import { toEventRow } from "@/server/google/mapper";

describe("toEventRow", () => {
  it("maps a timed event", () => {
    const row = toEventRow("cal-1", {
      id: "e1",
      summary: "회의",
      location: "3층",
      start: { dateTime: "2026-10-21T15:00:00+09:00" },
      end: { dateTime: "2026-10-21T16:00:00+09:00" },
    });
    expect(row).toMatchObject({
      calendarId: "cal-1",
      googleEventId: "e1",
      title: "회의",
      location: "3층",
      allDay: false,
      status: "confirmed",
    });
    expect(row!.startAt.toISOString()).toBe("2026-10-21T06:00:00.000Z");
    expect(row!.endAt.toISOString()).toBe("2026-10-21T07:00:00.000Z");
  });

  it("stores all-day events at UTC midnight with exclusive end", () => {
    const row = toEventRow("cal-1", { id: "e2", start: { date: "2026-10-21" }, end: { date: "2026-10-23" } });
    expect(row!.allDay).toBe(true);
    expect(row!.startAt.toISOString()).toBe("2026-10-21T00:00:00.000Z");
    expect(row!.endAt.toISOString()).toBe("2026-10-23T00:00:00.000Z");
    expect(row!.title).toBe("");
  });

  it("extracts the Google Meet link", () => {
    const base = { id: "e4", start: { date: "2026-10-21" }, end: { date: "2026-10-22" } };
    expect(toEventRow("cal-1", { ...base, hangoutLink: "https://meet.google.com/abc-defg-hij" })!.meetUrl).toBe(
      "https://meet.google.com/abc-defg-hij",
    );
    const conf = { entryPoints: [{ entryPointType: "phone", uri: "tel:+1" }, { entryPointType: "video", uri: "https://meet.google.com/x" }] };
    expect(toEventRow("cal-1", { ...base, conferenceData: conf })!.meetUrl).toBe("https://meet.google.com/x");
    expect(toEventRow("cal-1", base)!.meetUrl).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(toEventRow("cal-1", { id: "e3", start: { date: "2026-10-21" } })).toBeNull();
    expect(toEventRow("cal-1", { start: { date: "2026-10-21" }, end: { date: "2026-10-22" } })).toBeNull();
  });
});
