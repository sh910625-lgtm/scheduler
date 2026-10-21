import { Icon } from "@/components/ui/icon";
import { formatTime } from "@/lib/datetime";
import type { DayEvent } from "../queries";

/** 캘린더 색상을 배지 배경용 반투명 색으로 */
export function tint(color: string | null, alpha = "22") {
  return `${color ?? "#727785"}${alpha}`;
}

export function CalendarBadge({ name, color }: { name: string; color: string | null }) {
  return (
    <span
      className="inline-flex max-w-32 shrink-0 items-center gap-1 truncate rounded-full px-2 py-0.5 text-label-sm"
      style={{ backgroundColor: tint(color), color: "var(--color-on-surface)" }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? "#727785" }} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function MeetButton({ href, label = "회의 참여" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-3 py-1.5 text-label-md font-semibold text-on-primary-container shadow-sm transition-all hover:bg-primary active:scale-95"
    >
      <Icon name="video_call" className="text-[18px]" />
      {label}
    </a>
  );
}

/** 캘린더 화면의 일정 카드 (왼쪽 시간 + 캘린더 색 테두리 카드) */
export function EventCard({ event, timeZone }: { event: DayEvent; timeZone: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-12 shrink-0 pt-3 text-label-md tabular-nums">
        {event.allDay ? (
          <span className="text-on-surface-variant">종일</span>
        ) : (
          <>
            <span className="block text-on-surface">{formatTime(event.startAt, timeZone)}</span>
            <span className="block text-on-surface-variant">{formatTime(event.endAt, timeZone)}</span>
          </>
        )}
      </div>
      <div
        className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl border-l-4 bg-surface-container-low p-3.5 shadow-sm"
        style={{ borderLeftColor: event.color ?? "#727785" }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-label-lg font-medium text-on-surface">{event.title || "(제목 없음)"}</span>
          <CalendarBadge name={event.calendarName} color={event.color} />
        </div>
        {event.location && (
          <span className="flex min-w-0 items-center gap-1 text-body-sm text-on-surface-variant">
            <Icon name="location_on" className="text-[15px]" />
            <span className="truncate">{event.location}</span>
          </span>
        )}
        {event.meetUrl && (
          <div className="pt-1">
            <MeetButton href={event.meetUrl} label="지금 회의 참여" />
          </div>
        )}
      </div>
    </div>
  );
}
