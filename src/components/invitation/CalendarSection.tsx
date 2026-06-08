"use client";

import { useEffect, useState } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
const weekdaysLong = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function safeDate(date: string) {
  const parsed = date ? new Date(`${date}T00:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
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

// "13:30" 또는 "오후 1시 30분" 형식 → { hours, minutes }
function parseWeddingTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;

  const hhmm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    return { hours: parseInt(hhmm[1], 10), minutes: parseInt(hhmm[2], 10) };
  }

  const koMatch = timeStr.match(/(오전|오후)\s*(\d{1,2})시\s*(\d{1,2})분/);
  if (koMatch) {
    let hours = parseInt(koMatch[2], 10);
    const minutes = parseInt(koMatch[3], 10);
    if (koMatch[1] === "오후" && hours !== 12) hours += 12;
    if (koMatch[1] === "오전" && hours === 12) hours = 0;
    return { hours, minutes };
  }

  return null;
}

function buildTargetDate(weddingDate: string, weddingTime: string): Date | null {
  const parsed = parseWeddingTime(weddingTime);
  if (!parsed) return null;
  const d = new Date(`${weddingDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

type Cd = { days: number; hours: number; minutes: number; seconds: number; ended: boolean };

function calcCountdown(target: Date): Cd {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    ended: false,
  };
}

export default function CalendarSection({ invitation }: { invitation: NormalizedInvitation }) {
  const date = safeDate(invitation.basic.weddingDate);
  const cells = getCalendarCells(date);
  const today = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000,
  );
  const ddayText =
    diffDays === 0
      ? "오늘입니다"
      : diffDays > 0
        ? `${diffDays}일 남았습니다`
        : `${Math.abs(diffDays)}일 지났습니다`;

  const showDday = invitation.calendar.showDday;
  const showCountdown = invitation.calendar.showCountdown;

  const [countdown, setCountdown] = useState<Cd>({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });

  useEffect(() => {
    if (!showCountdown) return;
    const target = buildTargetDate(invitation.basic.weddingDate, invitation.basic.weddingTime);
    if (!target) return;

    setCountdown(calcCountdown(target));
    const id = setInterval(() => setCountdown(calcCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [showCountdown, invitation.basic.weddingDate, invitation.basic.weddingTime]);

  if (!invitation.calendar.enabled) return null;

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
                <span
                  className={`grid size-7 place-items-center rounded-full ${
                    day === date.getDate() ? "bg-[var(--invite-accent)] text-white" : ""
                  }`}
                >
                  {day}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCountdown && (
        <div className="mt-8 flex justify-center gap-3">
          {(
            [
              { value: pad(countdown.days), label: "DAYS" },
              { value: pad(countdown.hours), label: "HOUR" },
              { value: pad(countdown.minutes), label: "MIN" },
              { value: pad(countdown.seconds), label: "SEC" },
            ] as const
          ).map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="flex h-12 min-w-[44px] items-center justify-center rounded-[6px] bg-[var(--invite-accent)] px-2 text-[20px] font-light leading-none text-white">
                {value}
              </span>
              <span className="mt-1 text-[9px] tracking-[0.12em] text-[var(--invite-muted)]">{label}</span>
            </div>
          ))}
        </div>
      )}

      {showDday && (
        <p className="mt-8 text-[13px] leading-6 text-[var(--invite-muted)]">
          {invitation.basic.groomName} ♥ {invitation.basic.brideName}의 결혼식이 {ddayText}.
        </p>
      )}
    </section>
  );
}
