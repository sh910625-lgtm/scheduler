const DAY_MS = 86_400_000;

/** 주어진 시간대 기준 "YYYY-MM-DD" */
export function dateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

/** 시간대 기준 오늘부터 n일치 날짜 키 */
export function nextDateKeys(from: Date, days: number, timeZone: string) {
  return Array.from({ length: days }, (_, i) => dateKey(new Date(from.getTime() + i * DAY_MS), timeZone));
}

/** "10월 21일 (화)" */
export function formatDayLabel(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", month: "long", day: "numeric", weekday: "short" }).format(
    d,
  );
}

/** "오후 3:00" */
export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
}

/**
 * 종일 일정이 걸쳐 있는 날짜 키 목록. 종일 일정은 UTC 자정 기준으로 저장되고
 * endAt은 exclusive이다.
 */
export function allDayKeys(startAt: Date, endAt: Date) {
  const keys: string[] = [];
  for (let t = startAt.getTime(); t < endAt.getTime(); t += DAY_MS) {
    keys.push(new Date(t).toISOString().slice(0, 10));
  }
  return keys;
}
