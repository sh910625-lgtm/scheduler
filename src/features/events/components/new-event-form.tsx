"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { createEvent, type CreateEventState } from "../actions";

type CalendarOption = { id: string; summary: string; color: string | null };

const REMINDERS = [
  { value: "default", label: "캘린더 기본 알림" },
  { value: "0", label: "일정 시작 시" },
  { value: "10", label: "10분 전" },
  { value: "30", label: "30분 전" },
  { value: "60", label: "1시간 전" },
];

const fieldBox = "flex items-start gap-3 rounded-2xl bg-surface-container-low p-3.5";
const inputBase =
  "w-full rounded-lg bg-transparent text-body-lg text-on-surface outline-none placeholder:text-outline focus:bg-surface-container-lowest";

export function NewEventForm({ calendars, defaultDate }: { calendars: CalendarOption[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<CreateEventState, FormData>(createEvent, {});
  // React 19는 action 후 폼을 초기화하므로, 오류 시 입력값이 남도록 제어 컴포넌트로 둔다
  const [v, setV] = useState({
    title: "",
    date: defaultDate,
    allDay: false,
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    description: "",
    calendarId: calendars[0]?.id ?? "",
    reminder: "default",
    addMeet: false,
  });
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((p) => ({ ...p, [k]: value }));
  const err = state.fieldErrors ?? {};
  const selectedCal = calendars.find((c) => c.id === v.calendarId);

  if (calendars.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-container-low p-4 text-body-md text-on-surface-variant">
        일정을 추가할 수 있는(편집 권한이 있는) 캘린더가 없습니다. 연동 관리에서 동기화를 먼저 실행해 주세요.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-headline-sm">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <Icon name="edit_calendar" className="text-[18px]" />
          </span>
          일정 정보
        </h2>

        <label className={fieldBox}>
          <Icon name="title" className="mt-4 text-[22px] text-primary" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label-md text-on-surface-variant">일정 제목</span>
            <input
              name="title"
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="예: 팀 주간 회의"
              className={inputBase}
              autoFocus
            />
            {err.title && <FieldError>{err.title}</FieldError>}
          </span>
        </label>

        <div className={fieldBox}>
          <Icon name="schedule" className="mt-4 text-[22px] text-primary" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-label-md text-on-surface-variant">일시</span>
              <label className="flex items-center gap-1.5 text-label-md">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={v.allDay}
                  onChange={(e) => set("allDay", e.target.checked)}
                  className="size-4 accent-primary"
                />
                종일
              </label>
            </div>
            <input
              type="date"
              name="date"
              value={v.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputBase}
            />
            {!v.allDay && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  name="startTime"
                  value={v.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  className={inputBase}
                  aria-label="시작 시간"
                />
                <span className="text-on-surface-variant">–</span>
                <input
                  type="time"
                  name="endTime"
                  value={v.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  className={inputBase}
                  aria-label="종료 시간"
                />
              </div>
            )}
            {(err.date || err.endTime || err.startTime) && (
              <FieldError>{err.date ?? err.endTime ?? err.startTime}</FieldError>
            )}
          </div>
        </div>

        <label className={fieldBox}>
          <Icon name="location_on" className="mt-4 text-[22px] text-primary" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label-md text-on-surface-variant">장소 (선택)</span>
            <input
              name="location"
              value={v.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="예: 본사 4층 회의실"
              className={inputBase}
            />
          </span>
        </label>

        <label className={fieldBox}>
          <Icon name="notes" className="mt-4 text-[22px] text-primary" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label-md text-on-surface-variant">설명 (선택)</span>
            <textarea
              name="description"
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={`${inputBase} resize-none`}
            />
          </span>
        </label>

        <label className={`${fieldBox} cursor-pointer items-center`}>
          <Icon name="videocam" className="text-[22px] text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-label-lg">Google Meet 화상 회의 추가</span>
            <span className="text-body-sm text-on-surface-variant">등록할 때 회의 링크가 자동으로 만들어집니다</span>
          </span>
          <input
            type="checkbox"
            name="addMeet"
            checked={v.addMeet}
            onChange={(e) => set("addMeet", e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${
              v.addMeet ? "bg-primary" : "bg-surface-container-highest"
            }`}
          >
            <span
              className={`mt-0.5 ml-0.5 inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                v.addMeet ? "translate-x-5" : ""
              }`}
            />
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
        <h2 className="text-headline-sm">캘린더 및 알림 설정</h2>
        <label className={`${fieldBox} items-center`}>
          <span className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: selectedCal?.color ?? "#727785" }} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-label-md text-on-surface-variant">대상 캘린더</span>
            <select
              name="calendarId"
              value={v.calendarId}
              onChange={(e) => set("calendarId", e.target.value)}
              className={`${inputBase} text-label-lg`}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.summary}
                </option>
              ))}
            </select>
            {err.calendarId && <FieldError>{err.calendarId}</FieldError>}
          </span>
        </label>
        <label className={`${fieldBox} items-center`}>
          <Icon name="notifications_active" className="text-[22px] text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-label-md text-on-surface-variant">알림 설정</span>
            <select
              name="reminder"
              value={v.reminder}
              onChange={(e) => set("reminder", e.target.value)}
              className={`${inputBase} text-label-lg`}
            >
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </span>
        </label>
      </section>

      {state.error && (
        <p role="alert" className="rounded-2xl bg-error-container p-3 text-body-md text-on-error-container">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-2xl bg-primary-container py-4 text-body-lg font-semibold text-on-primary-container shadow-[0_4px_12px_rgba(26,115,232,0.3)] transition-all active:scale-[0.98] disabled:opacity-60"
      >
        <Icon name={pending ? "progress_activity" : "cloud_upload"} className={`text-[22px] ${pending ? "animate-spin" : ""}`} />
        {pending ? "등록 중…" : "Google Calendar에 일정 등록하기"}
      </button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="text-body-sm text-error">{children}</span>;
}
