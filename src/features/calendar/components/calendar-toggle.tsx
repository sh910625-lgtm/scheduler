"use client";

import { useOptimistic, useTransition } from "react";
import { setCalendarEnabled } from "../actions";

export function CalendarToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(enabled);

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.checked;
        startTransition(async () => {
          setChecked(next);
          await setCalendarEnabled(id, next);
        });
      }}
      className="size-4 accent-zinc-900 dark:accent-zinc-100"
    />
  );
}
