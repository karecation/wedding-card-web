"use client";

import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const weekdaysLong = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function safeDate(date: string) {
  const parsed = date ? new Date(`${date}T00:00:00`) : new Date("2026-05-19T00:00:00");
  return Number.isNaN(parsed.getTime()) ? new Date("2026-05-19T00:00:00") : parsed;
}

function getCalendarCells(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ];
}

export default function CalendarSection({ invitation }: { invitation: NormalizedInvitation }) {
  if (!invitation.calendar.enabled) return null;

  const date = safeDate(invitation.basic.weddingDate);
  const cells = getCalendarCells(date);
  const today = new Date();
  const diff = Math.ceil((date.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  const ddayText = diff === 0 ? "오늘입니다" : diff > 0 ? `${diff}일 남았습니다` : `${Math.abs(diff)}일 지났습니다`;

  return (
    <section className="px-7 py-12 text-center">
      <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">CALENDAR</p>
      <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">
        {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()}
      </h2>
      <p className="mt-1 text-[13px] text-[var(--invite-muted)]">
        {weekdaysLong[date.getDay()]} {invitation.basic.weddingTime}
      </p>
      <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />

      <div className="mx-auto mt-8 max-w-[310px]">
        <div className="grid grid-cols-7 text-[11px] text-[#b59a8e]">
          {weekdays.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-[12px] text-[#6e5a51]">
          {cells.map((day, index) => (
            <div key={`${day ?? "blank"}-${index}`} className="grid h-9 place-items-center">
              {day && (
                <span className={`grid size-7 place-items-center rounded-full ${day === date.getDate() ? "bg-[var(--invite-accent)] text-white" : ""}`}>
                  {day}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 text-[13px] leading-6 text-[var(--invite-muted)]">
        {invitation.basic.groomName} ♥ {invitation.basic.brideName}의 결혼식이 {ddayText}.
      </p>
    </section>
  );
}
