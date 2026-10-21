import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getCurrentUser } from "@/server/session";
import { prepareCalendar } from "@/features/calendar/prepare";
import { ReconnectNotice } from "@/features/calendar/components/reconnect-notice";
import { SyncButton } from "@/features/calendar/components/sync-button";
import {
  getDayEvents,
  getLastSyncedAt,
  getMonthDots,
  getUserCalendars,
  getUserTimeZone,
} from "@/features/events/queries";
import { EventCard } from "@/features/events/components/event-card";
import {
  addDays,
  addMonths,
  dateKey,
  formatDayLabel,
  formatMonthLabel,
  formatRelative,
  weekdayMonFirst,
} from "@/lib/datetime";

type Search = { m?: string; d?: string; cal?: string };

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<p className="pt-4 text-body-md text-on-surface-variant">불러오는 중…</p>}>
      <CalendarView searchParams={searchParams as Promise<Search>} />
    </Suspense>
  );
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const isDateKey = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isMonthKey = (v?: string) => !!v && /^\d{4}-\d{2}$/.test(v);

function href(params: Search) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  return `/calendar${q.size ? `?${q}` : ""}`;
}

async function CalendarView({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getCurrentUser();
  if ((await prepareCalendar(user.id)) === "reconnect") return <ReconnectNotice />;

  const params = await searchParams;
  const timeZone = await getUserTimeZone(user.id);
  const now = new Date();
  const today = dateKey(now, timeZone);

  const selected = isDateKey(params.d) ? params.d! : isMonthKey(params.m) ? `${params.m}-01` : today;
  const month = isMonthKey(params.m) ? params.m! : selected.slice(0, 7);
  const calendars = (await getUserCalendars(user.id)).filter((c) => c.enabled);
  const calFilter = calendars.some((c) => c.id === params.cal) ? params.cal : undefined;

  // 월요일 시작 6주 이내 그리드
  const first = `${month}-01`;
  const gridStart = addDays(first, -weekdayMonFirst(first));
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  const gridEnd = addDays(last, 6 - weekdayMonFirst(last));
  const cells: string[] = [];
  for (let k = gridStart; k <= gridEnd; k = addDays(k, 1)) cells.push(k);

  const [dots, dayEvents, lastSyncedAt] = await Promise.all([
    getMonthDots(user.id, gridStart, gridEnd, timeZone, calFilter),
    getDayEvents(user.id, selected, timeZone, calFilter),
    getLastSyncedAt(user.id),
  ]);

  return (
    <div className="flex flex-col gap-3">
      <section className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <Link
            href={href({ m: addMonths(month, -1), cal: calFilter })}
            aria-label="이전 달"
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface-container active:scale-95"
          >
            <Icon name="chevron_left" className="text-[22px]" />
          </Link>
          <span className="text-headline-md tracking-tight select-none">{formatMonthLabel(month)}</span>
          <Link
            href={href({ m: addMonths(month, 1), cal: calFilter })}
            aria-label="다음 달"
            className="flex size-10 items-center justify-center rounded-full hover:bg-surface-container active:scale-95"
          >
            <Icon name="chevron_right" className="text-[22px]" />
          </Link>
        </div>
        <Link
          href={href({ cal: calFilter })}
          className="flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1.5 text-label-md text-on-primary-fixed-variant shadow-sm active:scale-95"
        >
          <Icon name="event" filled className="text-[16px] text-primary" />
          오늘
        </Link>
      </section>

      <section className="no-scrollbar -mx-margin overflow-x-auto px-margin">
        <div className="flex min-w-max items-center gap-1.5">
          <FilterChip label="전체" color="var(--color-primary)" active={!calFilter} href={href({ m: month, d: selected })} />
          {calendars.map((c) => (
            <FilterChip
              key={c.id}
              label={c.summary}
              color={c.color ?? "#727785"}
              active={calFilter === c.id}
              href={href({ m: month, d: selected, cal: c.id })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-2 shadow-sm">
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`py-1 text-label-sm ${i === 6 ? "text-error" : i === 5 ? "text-outline" : "text-on-surface-variant"}`}
            >
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {cells.map((k) => {
            const inMonth = k.startsWith(month);
            const isSelected = k === selected;
            const isToday = k === today;
            const wd = weekdayMonFirst(k);
            return (
              <Link
                key={k}
                href={href({ m: month, d: k, cal: calFilter })}
                aria-current={isSelected ? "date" : undefined}
                className={`flex flex-col items-center justify-center rounded-xl py-1 transition-all hover:bg-surface-container ${
                  inMonth ? "" : "opacity-30"
                }`}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-label-md ${
                    isSelected
                      ? "bg-primary-container font-semibold text-on-primary-container shadow-md"
                      : isToday
                        ? "font-semibold text-primary ring-1 ring-primary"
                        : wd === 6
                          ? "text-error"
                          : wd === 5
                            ? "text-outline"
                            : "text-on-surface"
                  }`}
                >
                  {Number(k.slice(8))}
                </span>
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                  {(dots.get(k) ?? []).map((c) => (
                    <span key={c} className="size-1.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-md tracking-tight">{formatDayLabel(selected)}</h2>
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
            총 {dayEvents.length}개 일정
          </span>
        </div>
        {dayEvents.length === 0 ? (
          <Link
            href={`/events/new?date=${selected}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-6 text-label-lg text-primary"
          >
            <Icon name="add_circle" className="text-[20px]" /> 이 날짜에 일정 추가
          </Link>
        ) : (
          dayEvents.map((e) => <EventCard key={e.id} event={e} timeZone={timeZone} />)
        )}
      </section>

      <section className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${lastSyncedAt ? "bg-secondary" : "bg-outline"}`} />
          <div className="flex flex-col">
            <span className="text-body-md">구글 캘린더 동기화</span>
            <span className="text-label-md">
              마지막 동기화: {lastSyncedAt ? formatRelative(lastSyncedAt, now) : "없음"}
            </span>
          </div>
        </div>
        <SyncButton className="size-10 rounded-full text-primary hover:bg-surface-container" />
      </section>
    </div>
  );
}

function FilterChip({ label, color, active, href }: { label: string; color: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex max-w-48 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-md transition-all ${
        active
          ? "bg-primary-fixed text-on-primary-fixed-variant shadow-sm"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
