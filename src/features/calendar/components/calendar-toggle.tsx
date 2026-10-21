"use client";

import { useOptimistic, useTransition } from "react";
import { setCalendarEnabled } from "../actions";

/** 캘린더 동기화 on/off 스위치 */
export function CalendarToggle({ id, enabled, label }: { id: string; enabled: boolean; label: string }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(enabled);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} 동기화`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setChecked(!checked);
          await setCalendarEnabled(id, !checked);
        })
      }
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-60 ${
        checked ? "bg-primary" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`mt-0.5 ml-0.5 inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
