"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";

const tabs = [
  { href: "/today", label: "오늘", icon: "today" },
  { href: "/calendar", label: "캘린더", icon: "calendar_month" },
  { href: "/events/new", label: "일정 추가", icon: "add", primary: true },
  { href: "/settings", label: "연동 관리", icon: "sync_saved_locally" },
] as const;

export const pageSubtitles: Record<string, string> = {
  "/today": "Today Briefing",
  "/calendar": "Calendar View",
  "/events/new": "New Event",
  "/settings": "Sync Management",
};

export function PageSubtitle() {
  const pathname = usePathname();
  return <>{pageSubtitles[pathname] ?? ""}</>;
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 bg-surface/90 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-lg items-center justify-around px-3">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          if ("primary" in tab) {
            return (
              <Link key={tab.href} href={tab.href} className="flex min-w-16 flex-col items-center gap-1">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(26,115,232,0.3)]">
                  <Icon name={tab.icon} className="text-[26px]" />
                </span>
                <span className="mt-0.5 text-label-sm text-primary">{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 transition-colors ${
                active ? "font-semibold text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon name={tab.icon} filled={active} className="text-[24px]" />
              <span className="text-label-sm">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
