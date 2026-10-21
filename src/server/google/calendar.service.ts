import "server-only";
import { randomUUID } from "node:crypto";
import type { calendar_v3 } from "googleapis";
import { getCalendarClient } from "./client";

export type NewEventInput = {
  googleCalendarId: string;
  title: string;
  description?: string;
  location?: string;
  start: calendar_v3.Schema$EventDateTime;
  end: calendar_v3.Schema$EventDateTime;
  /** 팝업 알림 (분 전). null이면 캘린더 기본 알림 사용 */
  reminderMinutes: number | null;
  addMeet: boolean;
};

/** Google 캘린더에 일정을 만들고, 생성된 이벤트를 반환 */
export async function insertGoogleEvent(userId: string, input: NewEventInput) {
  const api = await getCalendarClient(userId);
  const res = await api.events.insert({
    calendarId: input.googleCalendarId,
    conferenceDataVersion: input.addMeet ? 1 : 0,
    requestBody: {
      summary: input.title,
      description: input.description,
      location: input.location,
      start: input.start,
      end: input.end,
      reminders:
        input.reminderMinutes === null
          ? { useDefault: true }
          : { useDefault: false, overrides: [{ method: "popup", minutes: input.reminderMinutes }] },
      conferenceData: input.addMeet
        ? { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } }
        : undefined,
    },
  });
  return res.data;
}
