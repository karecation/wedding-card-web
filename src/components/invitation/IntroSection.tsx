"use client";

import type { CSSProperties } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

const weekdaysEn = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const weekdaysKo = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const particles = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  left: `${6 + ((index * 13) % 86)}%`,
  delay: `${(index % 8) * 0.42}s`,
  duration: `${6.8 + (index % 5) * 0.65}s`,
  size: `${8 + (index % 5) * 2}px`,
  drift: `${index % 2 === 0 ? "" : "-"}${18 + (index % 6) * 7}px`,
  opacity: 0.34 + (index % 4) * 0.08,
}));

function getDate(date: string) {
  const parsed = date ? new Date(`${date}T00:00:00`) : new Date("2026-05-19T00:00:00");
  return Number.isNaN(parsed.getTime()) ? new Date("2026-05-19T00:00:00") : parsed;
}

function frameClass(style: NormalizedInvitation["design"]["frameStyle"]) {
  if (style === "arch") return "rounded-t-full";
  if (style === "ellipse") return "rounded-[50%]";
  if (style === "frame") return "rounded-[6px] border-[10px] border-white shadow-[0_8px_24px_rgba(70,50,40,0.12)]";
  if (style === "fill") return "rounded-none";
  return "rounded-[4px]";
}

function VisualEffect({ effect }: { effect: NormalizedInvitation["design"]["visualEffect"] }) {
  if (effect === "wave") {
    return (
      <div className="visual-effect-layer visual-wave">
        <svg viewBox="0 0 420 180" preserveAspectRatio="none" className="h-full w-full">
          <path d="M-20 104 Q45 64 110 104 T240 104 T370 104 T500 104 V190 H-20Z" fill="rgba(255,255,255,.28)" />
          <path d="M-20 124 Q55 86 130 124 T280 124 T430 124 V190 H-20Z" fill="rgba(255,246,238,.22)" />
        </svg>
      </div>
    );
  }

  if (effect === "fog") {
    return (
      <div className="visual-effect-layer visual-fog">
        <span />
        <span />
      </div>
    );
  }

  return null;
}

function particleMeta(type: NormalizedInvitation["design"]["particleEffect"]) {
  if (type === "heart") return { glyph: "♥", className: "particle-heart", color: "#e8a3ae" };
  if (type === "snow") return { glyph: "", className: "particle-snow", color: "#ffffff" };
  if (type === "sakura") return { glyph: "✿", className: "particle-fall", color: "#efb3bd" };
  if (type === "ginkgo") return { glyph: "◖", className: "particle-fall", color: "#e8cf72" };
  return { glyph: "✿", className: "particle-fall", color: "#efb3bd" };
}

function ParticleEffect({ type }: { type: NormalizedInvitation["design"]["particleEffect"] }) {
  if (type === "none") return null;
  const meta = particleMeta(type);

  return (
    <div className="particle-layer" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`particle ${meta.className}`}
          style={
            {
              left: particle.left,
              width: particle.size,
              height: particle.size,
              color: meta.color,
              opacity: particle.opacity,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              "--drift": particle.drift,
            } as CSSProperties
          }
        >
          {meta.glyph}
        </span>
      ))}
    </div>
  );
}

function IntroMedia({ invitation, src }: { invitation: NormalizedInvitation; src: string }) {
  return (
    <div className={`intro-media-frame relative mx-auto mt-8 aspect-[3/4] w-full max-w-[310px] overflow-hidden bg-[#e8e5e1] ${frameClass(invitation.design.frameStyle)}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="대표 사진" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-[#bbb]">
          <svg width="54" height="54" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M10 34 19 25l6 5 7-8 6 8" stroke="currentColor" strokeWidth="2" />
            <path d="M8 8 40 40" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      )}
      <VisualEffect effect={invitation.design.visualEffect} />
      <ParticleEffect type={invitation.design.particleEffect} />
    </div>
  );
}

function DateBlock({ date }: { date: Date }) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return (
    <>
      <div className="text-[25px] font-light tracking-[0.08em] text-[#30231c]">
        {yy} | {mm} | {dd}
      </div>
      <div className="mt-1.5 text-[11px] tracking-[0.34em] text-[#5e4035]">{weekdaysEn[date.getDay()]}</div>
    </>
  );
}

export default function IntroSection({ invitation }: { invitation: NormalizedInvitation }) {
  const date = getDate(invitation.basic.weddingDate);
  const venue = [invitation.basic.venueName, invitation.basic.venueHall].filter(Boolean).join(" ");
  const src = invitation.intro.mainImagePreviewUrl || invitation.intro.mainImageUrl || "";
  const names = `${invitation.basic.groomName}  |  ${invitation.basic.brideName}`;

  if (invitation.design.introLayout === "photoFirst") {
    return (
      <section className="px-7 pb-10 pt-7 text-center">
        <IntroMedia invitation={invitation} src={src} />
        <div className="mt-8">
          <DateBlock date={date} />
        </div>
        <p className="mt-7 whitespace-nowrap text-[17px] font-light tracking-[-0.01em] text-[#251b17]">{names}</p>
        <p className="mt-4 whitespace-nowrap text-[13px] leading-6 text-[#75635b]">
          {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일 {weekdaysKo[date.getDay()]} {invitation.basic.weddingTime}
        </p>
        <p className="whitespace-nowrap text-[13px] leading-6 text-[#8b766c]">{venue}</p>
      </section>
    );
  }

  if (invitation.design.introLayout === "minimal") {
    return (
      <section className="px-9 pb-12 pt-14 text-center">
        <p className="text-[10px] uppercase tracking-[0.36em] text-[var(--invite-accent-soft)]">{invitation.intro.subText}</p>
        <h1 className="mx-auto mt-7 max-w-[260px] text-[24px] font-light leading-[1.45] tracking-[0.02em] text-[#30231c]">{invitation.intro.headline}</h1>
        <div className="mx-auto mt-8 h-px w-12 bg-[var(--invite-border)]" />
        <p className="mt-8 whitespace-nowrap text-[18px] font-light tracking-[-0.01em] text-[#251b17]">{names}</p>
        <p className="mt-5 whitespace-nowrap text-[13px] leading-6 text-[#75635b]">
          {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일 {weekdaysKo[date.getDay()]} {invitation.basic.weddingTime}
        </p>
        <p className="whitespace-nowrap text-[13px] leading-6 text-[#8b766c]">{venue}</p>
      </section>
    );
  }

  if (invitation.design.introLayout === "saveTheDate" && src) {
    return (
      <section className="text-center">
        <div className={`intro-media-frame relative aspect-[3/4] w-full overflow-hidden ${frameClass(invitation.design.frameStyle)}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="대표 사진" className="h-full w-full object-cover" />
          <VisualEffect effect={invitation.design.visualEffect} />
          <ParticleEffect type={invitation.design.particleEffect} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.1)_45%,rgba(0,0,0,.5))]" />
          <div className="absolute inset-x-0 bottom-10 px-8 text-white">
            <p className="text-[10px] uppercase tracking-[0.34em] text-white/75">{invitation.intro.subText}</p>
            <h1 className="mt-2 text-[22px] font-light tracking-[0.04em]">{invitation.intro.headline}</h1>
            <p className="mt-4 whitespace-nowrap text-[15px] font-light">{names}</p>
            <p className="mt-2 text-[12px] text-white/75">
              {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일 {weekdaysKo[date.getDay()]} {invitation.basic.weddingTime}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-7 pb-10 pt-11 text-center">
      <DateBlock date={date} />

      <IntroMedia invitation={invitation} src={src} />

      <p className="mt-9 whitespace-nowrap text-[17px] font-light tracking-[-0.01em] text-[#251b17]">{names}</p>
      <p className="mt-5 whitespace-nowrap text-[13px] leading-6 text-[#75635b]">
        {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일 {weekdaysKo[date.getDay()]} {invitation.basic.weddingTime}
      </p>
      <p className="whitespace-nowrap text-[13px] leading-6 text-[#8b766c]">{venue}</p>
    </section>
  );
}
