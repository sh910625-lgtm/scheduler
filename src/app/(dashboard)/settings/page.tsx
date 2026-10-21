import { Suspense } from "react";
import { getCurrentUser } from "@/server/session";
import { getUserCalendars } from "@/features/events/queries";
import { CalendarToggle } from "@/features/calendar/components/calendar-toggle";

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold">연동 캘린더</h1>
      <p className="mt-1 text-sm text-zinc-500">체크한 캘린더의 일정만 동기화하고 표시합니다.</p>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">불러오는 중…</p>}>
        <CalendarSettings />
      </Suspense>
    </section>
  );
}

async function CalendarSettings() {
  const user = await getCurrentUser();
  const calendars = await getUserCalendars(user.id);

  if (calendars.length === 0) {
    return <p className="mt-6 text-sm text-zinc-500">아직 동기화된 캘린더가 없습니다. 일정 화면에서 동기화해 주세요.</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {calendars.map((c) => (
        <li key={c.id}>
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
            <CalendarToggle id={c.id} enabled={c.enabled} />
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "#999" }} />
            <span className="flex-1 truncate">{c.summary}</span>
            {c.lastSyncedAt && (
              <span className="text-xs text-zinc-500">
                {c.lastSyncedAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
              </span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
