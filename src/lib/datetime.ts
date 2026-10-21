const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

/** 주어진 시간대 기준 "YYYY-MM-DD" */
export function dateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date,
  );
}

/** "YYYY-MM-DD"에 n일을 더한 날짜 키 */
export function addDays(key: string, n: number) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM"에 n개월을 더한 월 키 */
export function addMonths(monthKey: string, n: number) {
  const d = new Date(`${monthKey}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** 0=월 … 6=일 */
export function weekdayMonFirst(key: string) {
  return (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** 시간대의 UTC 오프셋(ms) — 예: Asia/Seoul → +9h */
function tzOffset(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - at.getTime();
}

/** 시간대 기준 "YYYY-MM-DD HH:mm" 시각의 UTC Date */
export function zonedTime(key: string, time: string, timeZone: string) {
  const guess = new Date(`${key}T${time}:00Z`);
  const first = new Date(guess.getTime() - tzOffset(guess, timeZone));
  // DST 경계 보정
  return new Date(guess.getTime() - tzOffset(first, timeZone));
}

/** 시간대 기준 하루의 [시작, 끝) UTC 범위 */
export function dayRange(key: string, timeZone: string) {
  return { start: zonedTime(key, "00:00", timeZone), end: zonedTime(addDays(key, 1), "00:00", timeZone) };
}

/** 시간대 기준 시(0–23) */
export function hourIn(date: Date, timeZone: string) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(date));
}

/** "2026년 10월 21일 화요일" */
export function formatLongDate(key: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", dateStyle: "full" }).format(new Date(`${key}T00:00:00Z`));
}

/** "10월 21일 (화)" */
export function formatDayLabel(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  const md = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", month: "long", day: "numeric" }).format(d);
  const wd = new Intl.DateTimeFormat("ko-KR", { timeZone: "UTC", weekday: "short" }).format(d);
  return `${md} (${wd})`;
}

/** "2026년 10월" */
export function formatMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return `${y}년 ${m}월`;
}

/** "15:00" */
export function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    date,
  );
}

/** "방금 전" / "5분 전" / "3시간 전" / "2일 전" */
export function formatRelative(date: Date, now = new Date()) {
  const min = Math.floor((now.getTime() - date.getTime()) / MINUTE_MS);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  return `${Math.floor(min / (60 * 24))}일 전`;
}

/** "25분" / "1시간 10분" */
export function formatDuration(ms: number) {
  const min = Math.max(0, Math.round(ms / MINUTE_MS));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
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
