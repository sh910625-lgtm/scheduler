import { formatDayLabel, formatTime } from "@/lib/datetime";
import type { AgendaDay } from "../queries";

export function Agenda({ days, timeZone }: { days: AgendaDay[]; timeZone: string }) {
  return (
    <ol className="space-y-6">
      {days.map((day, i) => (
        <li key={day.key}>
          <h2 className="text-sm font-medium text-zinc-500">
            {formatDayLabel(day.key)}
            {i === 0 && <span className="ml-2 text-zinc-900 dark:text-zinc-100">오늘</span>}
          </h2>
          {day.events.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">일정 없음</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {day.events.map((e) => (
                <li
                  key={`${day.key}-${e.id}`}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: e.color ?? "#999" }}
                  />
                  <span className="w-20 shrink-0 text-zinc-500 tabular-nums">
                    {e.allDay ? "종일" : formatTime(e.startAt, timeZone)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{e.title || "(제목 없음)"}</span>
                    {e.location && <span className="block truncate text-xs text-zinc-500">{e.location}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
