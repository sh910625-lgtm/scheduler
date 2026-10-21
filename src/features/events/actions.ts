"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { calendars } from "@/server/db/schema";
import { getCurrentUser } from "@/server/session";
import { insertGoogleEvent } from "@/server/google/calendar.service";
import { applyEventChanges } from "@/server/google/sync.service";
import { getUserTimeZone } from "./queries";
import { parseNewEventForm, toGoogleTimes } from "./new-event";

export type CreateEventState = { error?: string; fieldErrors?: Record<string, string> };

export async function createEvent(_prev: CreateEventState, form: FormData): Promise<CreateEventState> {
  const user = await getCurrentUser();
  const parsed = parseNewEventForm(form);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const v = parsed.data;

  const calendar = await db.query.calendars.findFirst({
    where: and(
      eq(calendars.id, v.calendarId),
      eq(calendars.userId, user.id),
      inArray(calendars.accessRole, ["owner", "writer"]),
    ),
  });
  if (!calendar) return { fieldErrors: { calendarId: "일정을 추가할 수 없는 캘린더입니다." } };

  try {
    const created = await insertGoogleEvent(user.id, {
      googleCalendarId: calendar.googleCalendarId,
      title: v.title,
      description: v.description || undefined,
      location: v.location || undefined,
      ...toGoogleTimes(v, await getUserTimeZone(user.id)),
      reminderMinutes: v.reminder === "default" ? null : Number(v.reminder),
      addMeet: v.addMeet,
    });
    // 다음 동기화를 기다리지 않고 바로 화면에 보이도록 로컬에도 반영
    await applyEventChanges(calendar.id, [created]);
  } catch (e) {
    console.error("createEvent failed", e);
    return { error: "Google 캘린더에 일정을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  redirect(`/calendar?d=${v.date}`);
}
