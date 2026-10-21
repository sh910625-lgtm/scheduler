import { describe, expect, it } from "vitest";
import { CALENDAR_SCOPES, missingCalendarScopes } from "@/server/google/scopes";

describe("missingCalendarScopes", () => {
  it("reports calendar scopes the user did not grant", () => {
    const granted = "https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile";
    expect(missingCalendarScopes(granted)).toEqual(CALENDAR_SCOPES);
    expect(missingCalendarScopes(null)).toEqual(CALENDAR_SCOPES);
  });

  it("is empty when all calendar scopes are granted", () => {
    expect(missingCalendarScopes(`openid ${CALENDAR_SCOPES.join(" ")}`)).toEqual([]);
  });
});
