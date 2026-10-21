/** 앱이 동작하는 데 필요한 Google OAuth 권한 */
export const CALENDAR_SCOPES = [
  // 캘린더 목록 읽기 (calendarList.list)
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  // 일정 읽기/쓰기 (events.*)
  "https://www.googleapis.com/auth/calendar.events",
];

export const GOOGLE_SCOPE = ["openid", "email", "profile", ...CALENDAR_SCOPES].join(" ");

/** 저장된 scope 문자열에서 빠진 캘린더 권한 목록 */
export function missingCalendarScopes(granted: string | null | undefined) {
  const set = new Set((granted ?? "").split(/\s+/));
  return CALENDAR_SCOPES.filter((s) => !set.has(s));
}
