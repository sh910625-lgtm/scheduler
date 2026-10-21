import { z } from "zod";
import { addDays } from "@/lib/datetime";

const time = z.string().regex(/^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다.");

export const newEventSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 선택해 주세요."),
    allDay: z.boolean(),
    startTime: time,
    endTime: time,
    location: z.string().trim().max(300),
    description: z.string().trim().max(5000),
    calendarId: z.string().min(1, "캘린더를 선택해 주세요."),
    reminder: z.enum(["default", "0", "10", "30", "60"]),
    addMeet: z.boolean(),
  })
  .refine((v) => v.allDay || v.endTime > v.startTime, {
    path: ["endTime"],
    message: "종료 시간은 시작 시간보다 늦어야 합니다.",
  });

export type NewEventValues = z.infer<typeof newEventSchema>;

export function parseNewEventForm(form: FormData) {
  const str = (k: string) => String(form.get(k) ?? "");
  return newEventSchema.safeParse({
    title: str("title"),
    date: str("date"),
    allDay: form.get("allDay") === "on",
    startTime: str("startTime") || "09:00",
    endTime: str("endTime") || "10:00",
    location: str("location"),
    description: str("description"),
    calendarId: str("calendarId"),
    reminder: str("reminder") || "default",
    addMeet: form.get("addMeet") === "on",
  });
}

/** 폼 값 → Google 이벤트 start/end (종일 일정의 end.date는 다음 날, exclusive) */
export function toGoogleTimes(v: NewEventValues, timeZone: string) {
  if (v.allDay) {
    return { start: { date: v.date }, end: { date: addDays(v.date, 1) } };
  }
  return {
    start: { dateTime: `${v.date}T${v.startTime}:00`, timeZone },
    end: { dateTime: `${v.date}T${v.endTime}:00`, timeZone },
  };
}
