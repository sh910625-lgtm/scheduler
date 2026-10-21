import { Suspense } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getCurrentUser } from "@/server/session";
import { prepareCalendar } from "@/features/calendar/prepare";
import { ReconnectNotice } from "@/features/calendar/components/reconnect-notice";
import { SyncButton } from "@/features/calendar/components/sync-button";
import { getDayEvents, getLastSyncedAt, getUserTimeZone, type DayEvent } from "@/features/events/queries";
import { eventState, summarizeDay, type EventState } from "@/features/events/briefing";
import { CalendarBadge, MeetButton } from "@/features/events/components/event-card";
import {
  dateKey,
  formatDuration,
  formatLongDate,
  formatRelative,
  formatTime,
  hourIn,
} from "@/lib/datetime";

export default function TodayPage() {
  return (
    <Suspense fallback={<p className="pt-4 text-body-md text-on-surface-variant">불러오는 중…</p>}>
      <Briefing />
    </Suspense>
  );
}

function greeting(hour: number) {
  if (hour < 12) return "좋은 아침입니다";
  if (hour < 18) return "좋은 오후입니다";
  return "좋은 저녁입니다";
}

async function Briefing() {
  const user = await getCurrentUser();
  if ((await prepareCalendar(user.id)) === "reconnect") return <ReconnectNotice />;

  const timeZone = await getUserTimeZone(user.id);
  const now = new Date();
  const today = dateKey(now, timeZone);
  const [events, lastSyncedAt] = await Promise.all([getDayEvents(user.id, today, timeZone), getLastSyncedAt(user.id)]);
  const { next, remaining, total, freeMs } = summarizeDay(events, now, today, timeZone);
  const name = user.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <span className="text-label-md text-on-surface-variant">{formatLongDate(today)}</span>
        <h1 className="text-headline-lg-mobile tracking-tight text-on-surface">
          {greeting(hourIn(now, timeZone))}
          {name ? `, ${name}님!` : "!"} 👋
        </h1>
      </div>

      <section className="rounded-2xl bg-gradient-to-br from-primary-fixed/40 via-surface-container-low to-surface-container p-4 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-on-primary">
            <Icon name="summarize" filled className="text-[15px]" />
          </span>
          <span className="text-label-sm tracking-wide text-primary">오늘 요약</span>
        </div>
        <p className="text-body-md leading-relaxed font-medium">
          {total === 0 ? (
            "오늘은 등록된 일정이 없습니다."
          ) : (
            <>
              오늘 총 <span className="font-semibold text-primary">{total}개의 일정</span>이 있고,{" "}
              {remaining > 0 ? (
                <>
                  <span className="font-semibold text-primary">{remaining}개</span>가 남아 있습니다.
                </>
              ) : (
                "모두 끝났습니다."
              )}
            </>
          )}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <StatPill dot="bg-primary" label="남은 일정" value={`${remaining}건`} valueClass="text-primary" />
          <StatPill dot="bg-tertiary" label="완료" value={`${total - remaining}건`} valueClass="text-tertiary" />
          <StatPill
            dot="bg-secondary"
            label="남은 업무 시간 중 여유"
            value={formatDuration(freeMs)}
            valueClass="text-secondary"
          />
        </div>
      </section>

      {next && <NextUp event={next} now={now} timeZone={timeZone} />}

      <section className="flex flex-col gap-2.5">
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-headline-sm">오늘의 타임라인</h2>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
              {total}개 일정
            </span>
          </div>
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <span className="size-2 rounded-full bg-primary-container" /> 실시간 기준
          </span>
        </div>
        {total === 0 ? (
          <Link
            href="/events/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-6 text-label-lg text-primary"
          >
            <Icon name="add_circle" className="text-[20px]" /> 일정 추가하기
          </Link>
        ) : (
          events.map((e) => <TimelineItem key={e.id} event={e} state={eventState(e, now)} timeZone={timeZone} />)
        )}
      </section>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <SyncButton
          label={lastSyncedAt ? `${formatRelative(lastSyncedAt, now)} 동기화됨` : "지금 동기화"}
          className="rounded-2xl bg-surface-container-high px-3 py-3.5 text-label-md text-on-surface shadow-sm [&>.material-symbols-outlined]:text-primary"
        />
        <Link
          href="/calendar"
          className="flex items-center justify-center gap-2 rounded-2xl bg-surface-container-high px-3 py-3.5 text-label-md shadow-sm active:scale-95"
        >
          <Icon name="calendar_month" className="text-[20px] text-primary" /> 캘린더 보기
        </Link>
      </div>
    </div>
  );
}

function StatPill({ dot, label, value, valueClass }: { dot: string; label: string; value: string; valueClass: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-xl bg-surface-container-lowest px-2.5 py-1 text-label-sm shadow-sm">
      <span className={`size-2 rounded-full ${dot}`} />
      {label} <strong className={`font-semibold ${valueClass}`}>{value}</strong>
    </span>
  );
}

function NextUp({ event, now, timeZone }: { event: DayEvent; now: Date; timeZone: string }) {
  const ongoing = event.startAt <= now;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 shadow-md">
      <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/5" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm ${
            ongoing ? "bg-secondary-fixed/60 text-on-secondary-fixed-variant" : "animate-pulse bg-error-container text-on-error-container"
          }`}
        >
          <span className={`size-1.5 rounded-full ${ongoing ? "bg-secondary" : "bg-error"}`} />
          {ongoing ? `진행 중 · ${formatDuration(event.endAt.getTime() - now.getTime())} 남음` : `다음 일정까지 ${formatDuration(event.startAt.getTime() - now.getTime())} 남음`}
        </span>
        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Icon name="schedule" className="text-[16px] text-primary" />
          {formatTime(event.startAt, timeZone)} - {formatTime(event.endAt, timeZone)}
        </span>
      </div>
      <h2 className="mb-1 text-headline-sm">{event.title || "(제목 없음)"}</h2>
      <p className="mb-4 flex items-center gap-1 text-body-sm text-on-surface-variant">
        <Icon name={event.meetUrl ? "videocam" : "location_on"} className="text-[15px] text-primary" />
        {[event.meetUrl ? "Google Meet 화상 회의" : null, event.location, event.calendarName].filter(Boolean).join(" · ")}
      </p>
      <div className="flex justify-end">
        {event.meetUrl ? (
          <MeetButton href={event.meetUrl} label="Google Meet 바로 참여" />
        ) : (
          <CalendarBadge name={event.calendarName} color={event.color} />
        )}
      </div>
    </section>
  );
}

const stateStyles: Record<EventState, string> = {
  done: "bg-surface-container-low opacity-75",
  now: "border-l-4 border-primary bg-primary-fixed/40",
  soon: "border-l-4 border-primary bg-primary-fixed/40",
  later: "bg-surface-container-lowest shadow-sm",
};

function TimelineItem({ event, state, timeZone }: { event: DayEvent; state: EventState; timeZone: string }) {
  const highlight = state === "now" || state === "soon";
  return (
    <div className={`flex items-start gap-3 ${state === "done" ? "opacity-75" : ""}`}>
      <div
        className={`w-12 shrink-0 pt-3 text-right text-label-sm tabular-nums ${
          highlight ? "text-primary" : "text-on-surface-variant"
        }`}
      >
        {event.allDay ? "종일" : formatTime(event.startAt, timeZone)}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl p-3.5 ${stateStyles[state]}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {state === "done" && <Icon name="check_circle" filled className="text-[18px] text-secondary" />}
            {highlight && <span className="size-2 shrink-0 rounded-full bg-error" />}
            <span className={`truncate text-label-lg font-medium ${state === "done" ? "line-through" : ""}`}>
              {event.title || "(제목 없음)"}
            </span>
          </span>
          {highlight ? (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-label-sm text-on-primary">
              {state === "now" ? "진행 중" : "곧 시작"}
            </span>
          ) : (
            <CalendarBadge name={event.calendarName} color={event.color} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-on-surface-variant">
          {!event.allDay && (
            <span className="flex items-center gap-1">
              {event.meetUrl && <Icon name="videocam" className="text-[15px]" />}
              {formatTime(event.startAt, timeZone)} - {formatTime(event.endAt, timeZone)}
            </span>
          )}
          {event.location && (
            <>
              {!event.allDay && <span>·</span>}
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="location_on" className="text-[15px]" />
                <span className="truncate">{event.location}</span>
              </span>
            </>
          )}
          {event.meetUrl && state !== "done" && (
            <a href={event.meetUrl} target="_blank" rel="noreferrer" className="ml-auto font-medium text-primary">
              Google Meet 참여
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
