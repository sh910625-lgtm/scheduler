"use client";

import { useTransition } from "react";
import { syncNow } from "../actions";

export function SyncButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => syncNow())}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {pending ? "동기화 중…" : "지금 동기화"}
    </button>
  );
}
