import { Suspense } from "react";
import { getCurrentUser } from "@/server/session";
import { listGoogleCalendars } from "@/server/google/calendar.service";

export default function CalendarPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold">내 Google 캘린더</h1>
      <p className="mt-1 text-sm text-zinc-500">연동 확인용 목록입니다. 일정 뷰는 동기화 구현 후 추가됩니다.</p>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">불러오는 중…</p>}>
        <CalendarList />
      </Suspense>
    </section>
  );
}

async function CalendarList() {
  const user = await getCurrentUser();
  const calendars = await listGoogleCalendars(user.id);

  return (
    <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {calendars.map((c) => (
        <li key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.backgroundColor ?? "#999" }} />
          <span className="flex-1 truncate">{c.summary}</span>
          {c.primary && <span className="text-xs text-zinc-500">기본</span>}
        </li>
      ))}
    </ul>
  );
}
