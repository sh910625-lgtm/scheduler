"use client";

import { useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { syncNow } from "../actions";

/** 지금 동기화 버튼. label이 없으면 아이콘만 표시 */
export function SyncButton({ label, className = "" }: { label?: string; className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label ?? "지금 동기화"}
      onClick={() => startTransition(() => syncNow())}
      className={`flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${className}`}
    >
      <Icon name="sync" className={`text-[20px] ${pending ? "animate-spin" : ""}`} />
      {label && <span>{pending ? "동기화 중…" : label}</span>}
    </button>
  );
}
