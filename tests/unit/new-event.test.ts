import { describe, expect, it } from "vitest";
import { parseNewEventForm, toGoogleTimes } from "@/features/events/new-event";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

const base = { title: "회의", date: "2026-10-22", startTime: "15:00", endTime: "16:00", calendarId: "cal-1" };

describe("parseNewEventForm", () => {
  it("parses a timed event with defaults", () => {
    const r = parseNewEventForm(form(base));
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ title: "회의", allDay: false, addMeet: false, reminder: "default", location: "" });
  });

  it("rejects empty title and end before start", () => {
    const r = parseNewEventForm(form({ ...base, title: "  ", endTime: "14:00" }));
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain("title");
    expect(paths).toContain("endTime");
  });

  it("ignores time order for all-day events", () => {
    const r = parseNewEventForm(form({ ...base, allDay: "on", endTime: "08:00" }));
    expect(r.success).toBe(true);
  });
});

describe("toGoogleTimes", () => {
  it("builds dateTime with time zone for timed events", () => {
    const v = parseNewEventForm(form(base)).data!;
    expect(toGoogleTimes(v, "Asia/Seoul")).toEqual({
      start: { dateTime: "2026-10-22T15:00:00", timeZone: "Asia/Seoul" },
      end: { dateTime: "2026-10-22T16:00:00", timeZone: "Asia/Seoul" },
    });
  });

  it("uses exclusive next-day end date for all-day events", () => {
    const v = parseNewEventForm(form({ ...base, date: "2026-10-31", allDay: "on" })).data!;
    expect(toGoogleTimes(v, "Asia/Seoul")).toEqual({ start: { date: "2026-10-31" }, end: { date: "2026-11-01" } });
  });
});
