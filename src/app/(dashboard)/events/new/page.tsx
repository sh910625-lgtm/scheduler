import { Suspense } from "react";
import { getCurrentUser } from "@/server/session";
import { prepareCalendar } from "@/features/calendar/prepare";
import { ReconnectNotice } from "@/features/calendar/components/reconnect-notice";
import { getUserTimeZone, getWritableCalendars } from "@/features/events/queries";
import { NewEventForm } from "@/features/events/components/new-event-form";
import { dateKey } from "@/lib/datetime";

export default function NewEventPage({ searchParams }: PageProps<"/events/new">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-1 pt-2 text-headline-lg-mobile tracking-tight">
        새 일정 등록<span className="size-2 rounded-full bg-primary" />
      </h1>
      <Suspense fallback={<p className="text-body-md text-on-surface-variant">불러오는 중…</p>}>
        <NewEvent searchParams={searchParams as Promise<{ date?: string }>} />
      </Suspense>
    </div>
  );
}

async function NewEvent({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await getCurrentUser();
  if ((await prepareCalendar(user.id)) === "reconnect") return <ReconnectNotice />;

  const { date } = await searchParams;
  const [calendars, timeZone] = await Promise.all([getWritableCalendars(user.id), getUserTimeZone(user.id)]);
  const defaultDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey(new Date(), timeZone);

  return (
    <NewEventForm
      defaultDate={defaultDate}
      calendars={calendars.map((c) => ({ id: c.id, summary: c.summary, color: c.color }))}
    />
  );
}
