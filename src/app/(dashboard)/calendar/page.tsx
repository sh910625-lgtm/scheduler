import { Suspense } from "react";
import { getCurrentUser } from "@/server/session";
import { syncUser } from "@/server/google/sync.service";
import { getAgenda, getUserCalendars } from "@/features/events/queries";
import { Agenda } from "@/features/events/components/agenda";
import { SyncButton } from "@/features/calendar/components/sync-button";
import { ReconnectNotice } from "@/features/calendar/components/reconnect-notice";
import { getMissingCalendarScopes } from "@/server/google/client";

export default function CalendarPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">다가오는 일정</h1>
        <SyncButton />
      </div>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">불러오는 중…</p>}>
        <AgendaSection />
      </Suspense>
    </section>
  );
}

async function AgendaSection() {
  const user = await getCurrentUser();
  if ((await getMissingCalendarScopes(user.id)).length > 0) return <ReconnectNotice />;

  // 첫 방문(연동된 캘린더가 아직 없음)이면 바로 전체 동기화
  if ((await getUserCalendars(user.id)).length === 0) {
    await syncUser(user.id);
  }

  const { days, timeZone } = await getAgenda(user.id);
  return (
    <div className="mt-6">
      <Agenda days={days} timeZone={timeZone} />
    </div>
  );
}
