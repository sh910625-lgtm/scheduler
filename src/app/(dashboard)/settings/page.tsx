import { Suspense } from "react";
import { Icon } from "@/components/ui/icon";
import { signOut } from "@/server/auth";
import { getCurrentUser } from "@/server/session";
import { prepareCalendar } from "@/features/calendar/prepare";
import { getLastSyncedAt, getUserCalendars } from "@/features/events/queries";
import { CalendarToggle } from "@/features/calendar/components/calendar-toggle";
import { ReconnectNotice } from "@/features/calendar/components/reconnect-notice";
import { SyncButton } from "@/features/calendar/components/sync-button";
import { formatRelative } from "@/lib/datetime";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="pt-4 text-body-md text-on-surface-variant">불러오는 중…</p>}>
      <SyncManagement />
    </Suspense>
  );
}

const roleLabel: Record<string, string> = {
  owner: "소유자 · 일정 추가 가능",
  writer: "편집 가능 · 일정 추가 가능",
  reader: "읽기 전용",
  freeBusyReader: "바쁨 여부만 표시",
};

async function SyncManagement() {
  const user = await getCurrentUser();
  const status = await prepareCalendar(user.id);
  const [calendars, lastSyncedAt] = await Promise.all([getUserCalendars(user.id), getLastSyncedAt(user.id)]);
  const now = new Date();
  const sorted = calendars.toSorted((a, b) => Number(b.primary) - Number(a.primary));

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google 프로필 이미지(외부 도메인)
            <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full" />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface-container">
              <Icon name="account_circle" className="text-[32px] text-on-surface-variant" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="truncate text-headline-sm">{user.email}</span>
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm ${
                  status === "ok"
                    ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                    : "bg-error-container text-on-error-container"
                }`}
              >
                <span className={`size-1.5 rounded-full ${status === "ok" ? "bg-secondary" : "bg-error"}`} />
                {status === "ok" ? "정상 연동됨" : "권한 필요"}
              </span>
            </div>
            <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <Icon name="schedule" className="text-[15px]" />
              마지막 동기화: {lastSyncedAt ? formatRelative(lastSyncedAt, now) : "없음"}
            </span>
          </div>
        </div>
        {status === "ok" && (
          <SyncButton
            label="지금 즉시 동기화"
            className="w-full rounded-xl bg-surface-container-high py-3 text-label-lg font-semibold text-primary"
          />
        )}
      </section>

      {status === "reconnect" ? (
        <ReconnectNotice />
      ) : (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-headline-sm">동기화할 구글 캘린더 선택</h2>
            <span className="text-label-sm text-primary">{calendars.filter((c) => c.enabled).length}개 활성</span>
          </div>
          <ul className="flex flex-col gap-1 rounded-2xl bg-surface-container-lowest p-2 shadow-sm">
            {sorted.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-surface-container-low">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-3.5 shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: c.enabled ? (c.color ?? "#727785") : "var(--color-outline-variant)" }}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className={`truncate text-label-lg ${c.enabled ? "" : "text-on-surface-variant"}`}>
                      {c.primary ? `${c.summary} (기본)` : c.summary}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {roleLabel[c.accessRole] ?? c.accessRole}
                      {c.enabled && c.lastSyncedAt && ` · ${formatRelative(c.lastSyncedAt, now)} 동기화`}
                    </span>
                  </div>
                </div>
                <CalendarToggle id={c.id} enabled={c.enabled} label={c.summary} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <form
        className="flex justify-center"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="text-label-lg text-error underline decoration-error/40 underline-offset-4">
          로그아웃
        </button>
      </form>
    </div>
  );
}
