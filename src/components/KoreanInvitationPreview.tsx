"use client";

import type { InvitationData } from "@/types/invitation";

type KoreanInvitationPreviewProps = {
  data: InvitationData;
};

const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

function getWeddingDate(dateValue: string) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date("2026-05-18T00:00:00");
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return {
    date,
    heroDate: `${year} | ${month} | ${day}`,
    weekday: weekdays[date.getDay()],
    detail: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${koreanWeekdays[date.getDay()]}요일`,
  };
}

export default function KoreanInvitationPreview({ data }: KoreanInvitationPreviewProps) {
  const weddingDate = getWeddingDate(data.weddingDate);
  const groomName = data.groomName || `${data.groomLastName}${data.groomFirstName}` || "최신랑";
  const brideName = data.brideName || `${data.brideLastName}${data.brideFirstName}` || "이신부";
  const venue = [data.venueName, data.venueHall].filter(Boolean).join(" ") || "더리버사이드 호텔 몽블랑홀";

  return (
    <article className="mx-auto w-full max-w-[390px] rounded-[10px] border border-[#dedede] bg-white px-6 py-11 text-center text-[#222] shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:px-7">
      <div className="font-serif text-[25px] leading-none tracking-[0.04em] text-[#2a201d]">
        {weddingDate.heroDate}
      </div>
      <div className="mt-3 font-serif text-[13px] font-semibold tracking-[0.28em] text-[#3b2722]">
        {weddingDate.weekday}
      </div>

      <div className="mt-9 grid aspect-[0.73] w-full place-items-center overflow-hidden bg-[#e8e8e8]">
        {data.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.coverImage} alt="대표 사진" className="h-full w-full object-cover" />
        ) : (
          <div className="relative h-16 w-16 text-white">
            <div className="absolute inset-x-2 top-4 h-9 rounded-sm border-[5px] border-white" />
            <div className="absolute left-2 top-7 h-[5px] w-14 -rotate-45 rounded-full bg-white" />
          </div>
        )}
      </div>

      <div className="mt-9 whitespace-nowrap text-[17px] leading-none tracking-[-0.01em] text-[#111]">
        <span>{groomName}</span>
        <span className="mx-4 text-[#222]">|</span>
        <span>{brideName}</span>
      </div>

      <div className="mt-8 space-y-2 text-[13px] leading-none text-[#4d403b]">
        <p className="whitespace-nowrap">
          {weddingDate.detail} {data.weddingPeriod} {data.weddingHour} {data.weddingMinute}
        </p>
        <p className="whitespace-nowrap text-[#6b443b]">{venue}</p>
      </div>

      <section className="mt-24">
        <p className="font-serif text-[11px] tracking-[0.38em] text-[#d0b7ae]">INVITATION</p>
        <h2 className="mt-3 text-[17px] font-normal leading-none text-[#8f6e67]">{data.messageTitle || "초대합니다"}</h2>
        <p className="mx-auto mt-11 max-w-[270px] whitespace-pre-line text-[14px] font-normal leading-[2.05] tracking-[-0.02em] text-[#6b514d]">
          {data.message}
        </p>
      </section>

      <p className="mt-14 whitespace-nowrap text-[13px] leading-none tracking-[-0.02em] text-[#9a817b]">
        신랑 {groomName} <span className="mx-2">·</span> 신부 {brideName}
      </p>
    </article>
  );
}
