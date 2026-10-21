import { describe, expect, it } from "vitest";
import { allDayKeys, dateKey, nextDateKeys } from "@/lib/datetime";

describe("datetime", () => {
  it("dateKey uses the given time zone", () => {
    const d = new Date("2026-10-21T16:30:00Z"); // 서울 기준 10월 22일 01:30
    expect(dateKey(d, "Asia/Seoul")).toBe("2026-10-22");
    expect(dateKey(d, "UTC")).toBe("2026-10-21");
  });

  it("nextDateKeys returns consecutive days", () => {
    expect(nextDateKeys(new Date("2026-10-30T12:00:00Z"), 3, "Asia/Seoul")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("allDayKeys treats end as exclusive", () => {
    expect(allDayKeys(new Date("2026-10-21T00:00:00Z"), new Date("2026-10-23T00:00:00Z"))).toEqual([
      "2026-10-21",
      "2026-10-22",
    ]);
  });
});
