import { Suspense } from "react";
import Link from "next/link";
import { BottomNav, PageSubtitle } from "@/components/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { getCurrentUser } from "@/server/session";
import { getMissingCalendarScopes } from "@/server/google/client";
import { getLastSyncedAt } from "@/features/events/queries";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="pt-safe fixed inset-x-0 top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-2 px-margin">
          <Link href="/today" className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <Icon name="event_repeat" className="text-[20px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-headline-sm tracking-tight text-primary">SyncCal</span>
              <span className="truncate text-label-sm text-on-surface-variant">
                <PageSubtitle />
              </span>
            </span>
          </Link>
          <Suspense>
            <HeaderStatus />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-margin pt-20 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

async function HeaderStatus() {
  const user = await getCurrentUser();
  const [missing, lastSyncedAt] = await Promise.all([getMissingCalendarScopes(user.id), getLastSyncedAt(user.id)]);
  const ok = missing.length === 0 && lastSyncedAt !== null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${
          ok ? "bg-secondary-fixed/50 text-on-secondary-fixed-variant" : "bg-error-container text-on-error-container"
        }`}
      >
        <Icon name={ok ? "cloud_done" : "cloud_off"} className={`text-[15px] ${ok ? "text-secondary" : "text-error"}`} />
        <span className="whitespace-nowrap">{ok ? "구글 동기화됨" : "연동 필요"}</span>
      </span>
      <Link href="/settings" aria-label="연동 관리" className="flex size-11 items-center justify-center rounded-full hover:bg-surface-container">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google 프로필 이미지(외부 도메인)
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full object-cover" />
        ) : (
          <Icon name="account_circle" className="text-[32px] text-on-surface-variant" />
        )}
      </Link>
    </div>
  );
}
