"use client";

import { useEffect, useState } from "react";
import { getMainImageSrc } from "@/lib/invitation/getImageSrc";
import { getIntroImageSlotPreset } from "@/lib/invitation/introLayouts";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

const weekdaysEn = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const weekdaysKo = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

type IntroLayout = NormalizedInvitation["design"]["introLayout"];

function getDate(date: string) {
  const parsed = date ? new Date(`${date}T00:00:00`) : new Date("2026-05-19T00:00:00");
  return Number.isNaN(parsed.getTime()) ? new Date("2026-05-19T00:00:00") : parsed;
}

function frameClass(style: NormalizedInvitation["design"]["frameStyle"], layout: IntroLayout) {
  if (layout === "together") return "rounded-[10px]";
  if (layout === "goodday") return "rounded-[3px] shadow-[0_10px_22px_rgba(88,63,49,0.10)]";
  if (style === "arch") return "rounded-t-full";
  if (style === "ellipse") return "rounded-[50%]";
  if (style === "frame") return "rounded-[6px] border-[10px] border-white shadow-[0_8px_24px_rgba(70,50,40,0.12)]";
  if (style === "fill") return "rounded-none";
  return layout === "minimal" ? "rounded-[12px]" : "rounded-[4px]";
}

function DateBlock({ date, compact = false }: { date: Date; compact?: boolean }) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return (
    <>
      <div className={`${compact ? "text-[18px]" : "text-[25px]"} font-light tracking-[0.08em] text-[#30231c]`}>
        {yy} | {mm} | {dd}
      </div>
      <div className="mt-1.5 text-[11px] tracking-[0.34em] text-[#5e4035]">{weekdaysEn[date.getDay()]}</div>
    </>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center bg-[#e8e5e1] text-center text-[#b6aca5]">
      <div>
        <svg className="mx-auto" width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M10 34 19 25l6 5 7-8 6 8" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8 40 40" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="mt-3 text-[11px] tracking-[0.08em]">{label}</p>
      </div>
    </div>
  );
}

function IntroImageSlot({
  layout,
  frameStyle,
  imageUrl,
  showImage,
  onLoad,
  onError,
}: {
  layout: IntroLayout;
  frameStyle: NormalizedInvitation["design"]["frameStyle"];
  imageUrl: string;
  showImage: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  const config = getIntroImageSlotPreset(layout);

  return (
    <div className={`intro-image-slot mx-auto ${config.wrapClassName}`}>
      <div
        className={`intro-media-frame relative mx-auto overflow-hidden bg-[#e8e5e1] ${config.frameClassName} ${frameClass(frameStyle, layout)}`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="대표 사진"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onLoad={onLoad}
            onError={onError}
          />
        ) : (
          <Placeholder label={config.placeholder} />
        )}
      </div>
    </div>
  );
}

function WeddingLine({ date, time, venue }: { date: Date; time: string; venue: string }) {
  return (
    <>
      <p className="mt-5 whitespace-nowrap text-[13px] leading-6 text-[#75635b]">
        {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일 {weekdaysKo[date.getDay()]} {time}
      </p>
      {venue && <p className="whitespace-nowrap text-[13px] leading-6 text-[#8b766c]">{venue}</p>}
    </>
  );
}

export default function IntroSection({ invitation }: { invitation: NormalizedInvitation }) {
  const date = getDate(invitation.basic.weddingDate);
  const layout = invitation.design.introLayout;
  const venue = [invitation.basic.venueName, invitation.basic.venueHall].filter(Boolean).join(" ");
  const names = `${invitation.basic.groomName}  |  ${invitation.basic.brideName}`;
  const imageUrl = getMainImageSrc(invitation);
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(imageUrl) && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [imageUrl, layout]);

  const handleLoad = () => undefined;
  const handleError = () => {
    setImageError(true);
  };

  const imageSlot = (
    <IntroImageSlot
      layout={layout}
      frameStyle={invitation.design.frameStyle}
      imageUrl={imageUrl}
      showImage={showImage}
      onLoad={handleLoad}
      onError={handleError}
    />
  );

  if (layout === "minimal") {
    return (
      <section className="px-9 pb-14 pt-16 text-center">
        <DateBlock date={date} />
        {imageSlot}
        <div className="mx-auto mt-10 h-px w-10 bg-[var(--invite-border)]" />
        <p className="mt-9 whitespace-nowrap text-[17px] font-light tracking-[0.02em] text-[#251b17]">{names}</p>
        <WeddingLine date={date} time={invitation.basic.weddingTime} venue={venue} />
      </section>
    );
  }

  if (layout === "start") {
    return (
      <section className="px-7 pb-10 pt-8 text-center">
        <div className="flex items-center justify-center gap-3 text-[16px] font-light text-[#30231c]">
          <span>{invitation.basic.groomName}</span>
          <span className="text-[12px] tracking-[0.18em] text-[var(--invite-accent-soft)]">
            {String(date.getMonth() + 1).padStart(2, "0")} / {String(date.getDate()).padStart(2, "0")}
          </span>
          <span>{invitation.basic.brideName}</span>
        </div>
        {imageSlot}
        <div className="mt-8">
          <DateBlock date={date} compact />
        </div>
        <WeddingLine date={date} time={invitation.basic.weddingTime} venue={venue} />
      </section>
    );
  }

  if (layout === "together") {
    return (
      <section className="bg-[#f7f1ed] px-7 pb-12 pt-12 text-center">
        <div className="space-y-2 text-[20px] font-light tracking-[0.04em] text-[var(--invite-accent)]">
          <p>{invitation.basic.groomName}</p>
          <div className="mx-auto h-px w-5 bg-[var(--invite-accent)] opacity-50" />
          <p>{invitation.basic.brideName}</p>
        </div>
        {imageSlot}
        <h1 className="mx-auto mt-8 max-w-[260px] text-[18px] font-light leading-[1.7] text-[#5e4035]">
          {invitation.intro.headline}
        </h1>
        <WeddingLine date={date} time={invitation.basic.weddingTime} venue={venue} />
      </section>
    );
  }

  if (layout === "goodday") {
    return (
      <section className="bg-[radial-gradient(circle_at_1px_1px,rgba(120,92,72,0.10)_1px,transparent_0)] bg-[length:12px_12px] px-7 pb-11 pt-10 text-center">
        <p className="whitespace-nowrap text-[18px] font-light tracking-[-0.01em] text-[#251b17]">{names}</p>
        <WeddingLine date={date} time={invitation.basic.weddingTime} venue={venue} />
        {imageSlot}
        <p className="mx-auto mt-8 max-w-[270px] text-[13px] leading-7 text-[#7a665d]">{invitation.intro.headline}</p>
      </section>
    );
  }

  return (
    <section className="px-7 pb-10 pt-11 text-center">
      <DateBlock date={date} />
      {imageSlot}
      <p className="mt-9 whitespace-nowrap text-[17px] font-light tracking-[-0.01em] text-[#251b17]">{names}</p>
      <WeddingLine date={date} time={invitation.basic.weddingTime} venue={venue} />
    </section>
  );
}
