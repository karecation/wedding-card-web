"use client";

import type { InvitationData, IntroShape, IntroTemplate, TemplateMood } from "@/types/invitation";

/* ── Theme ─────────────────────────────────────────────────────────────────── */

type ThemeConfig = {
  bg: string; cardBg: string; accent: string;
  text: string; sub: string; light: string; border: string; btnBg: string; btnText: string;
};

const THEMES: Record<string, ThemeConfig> = {
  "모먼트":        { bg:"#fdf9f6", cardBg:"#fffcfa", accent:"#c9897a", text:"#4a3728", sub:"#8a6e66", light:"#b8a8a2", border:"#eeddd8", btnBg:"#c9897a", btnText:"#fff" },
  "미니멀":        { bg:"#f9f7f4", cardBg:"#ffffff", accent:"#7a6e65", text:"#2c2c2c", sub:"#6b6b6b", light:"#aaa",    border:"#e0d8d0", btnBg:"#4a4a4a", btnText:"#fff" },
  "시작":          { bg:"#f7f3ed", cardBg:"#fffef9", accent:"#c49a6c", text:"#2c2c2c", sub:"#7a6a5a", light:"#b5a090", border:"#e5d8c8", btnBg:"#c49a6c", btnText:"#fff" },
  "동행":          { bg:"#fef9f0", cardBg:"#fffdf5", accent:"#c4966a", text:"#3d2b1f", sub:"#8a6a4a", light:"#c4a87a", border:"#ead9b8", btnBg:"#c4966a", btnText:"#fff" },
  "클래식":        { bg:"#fafaf8", cardBg:"#ffffff", accent:"#8c7355", text:"#222",    sub:"#666",    light:"#aaa",    border:"#ddd8d0", btnBg:"#5a4a38", btnText:"#fff" },
  "세이브더데이트":{ bg:"#f0ece8", cardBg:"#f8f5f2", accent:"#a08060", text:"#1a1a1a", sub:"#555",    light:"#888",    border:"#ccc4b8", btnBg:"#4a3820", btnText:"#fff" },
  "모던 NEW":      { bg:"#fdf9f6", cardBg:"#fffcfa", accent:"#f49a79", text:"#222",    sub:"#666",    light:"#d0b7ae", border:"#e8d4cc", btnBg:"#f49a79", btnText:"#fff" },
  "고운고딕":      { bg:"#fdf9f6", cardBg:"#fffcfa", accent:"#c9897a", text:"#4a3728", sub:"#8a6e66", light:"#b8a8a2", border:"#eeddd8", btnBg:"#c9897a", btnText:"#fff" },
  "로맨틱":        { bg:"#fdf5f8", cardBg:"#fff8fb", accent:"#e87a9a", text:"#3a1a2a", sub:"#8a5a6a", light:"#d0a8b8", border:"#f0d0da", btnBg:"#e87a9a", btnText:"#fff" },
  "내추럴":        { bg:"#f5f5f0", cardBg:"#fafaf8", accent:"#8a9a6a", text:"#2a2a1a", sub:"#6a6a4a", light:"#aaa",    border:"#d8d8c8", btnBg:"#8a9a6a", btnText:"#fff" },
};

function getTheme(mood: TemplateMood): ThemeConfig {
  return THEMES[mood] ?? THEMES["모먼트"];
}

/* ── Date helpers ──────────────────────────────────────────────────────────── */

const WEEKDAYS_EN = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const WEEKDAYS_KO = ["일","월","화","수","목","금","토"];

function parseDateInfo(dateStr: string) {
  const d = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date("2026-05-19T00:00:00");
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return {
    heroDate: `${String(y).slice(2)} | ${m} | ${day}`,
    splitDate: `${m} / ${day}`,
    fullDate: `${y}년 ${d.getMonth()+1}월 ${d.getDate()}일`,
    weekdayEn: WEEKDAYS_EN[d.getDay()],
    weekdayKo: WEEKDAYS_KO[d.getDay()],
  };
}

/* ── Particle configs (deterministic – no Math.random) ─────────────────────── */

const PETAL_CFG = [
  { left:"8%",  delay:0,   dur:6.5, size:10 },
  { left:"22%", delay:1.2, dur:7.8, size:8  },
  { left:"38%", delay:2.4, dur:6.2, size:11 },
  { left:"52%", delay:0.7, dur:8.1, size:9  },
  { left:"66%", delay:3.0, dur:6.9, size:10 },
  { left:"79%", delay:1.8, dur:7.4, size:8  },
  { left:"91%", delay:0.4, dur:9.0, size:11 },
  { left:"15%", delay:4.2, dur:6.5, size:9  },
  { left:"44%", delay:5.1, dur:7.7, size:10 },
  { left:"73%", delay:2.3, dur:8.6, size:8  },
];

const HEART_CFG = [
  { left:"10%", delay:0,   dur:5.5, size:12 },
  { left:"25%", delay:1.4, dur:6.8, size:10 },
  { left:"42%", delay:2.8, dur:5.2, size:14 },
  { left:"58%", delay:0.9, dur:7.0, size:11 },
  { left:"74%", delay:2.2, dur:6.2, size:9  },
  { left:"87%", delay:4.0, dur:5.8, size:12 },
  { left:"33%", delay:3.5, dur:7.5, size:10 },
  { left:"65%", delay:5.1, dur:6.0, size:11 },
];

const SNOW_CFG = [
  { left:"5%",  delay:0,   dur:8.2, size:8  },
  { left:"18%", delay:1.1, dur:9.5, size:10 },
  { left:"30%", delay:2.4, dur:7.8, size:7  },
  { left:"45%", delay:0.6, dur:10.1,size:9  },
  { left:"57%", delay:3.5, dur:8.7, size:11 },
  { left:"70%", delay:1.7, dur:7.9, size:8  },
  { left:"83%", delay:4.0, dur:9.4, size:10 },
  { left:"93%", delay:0.3, dur:8.9, size:7  },
  { left:"37%", delay:5.6, dur:7.4, size:9  },
  { left:"62%", delay:6.1, dur:9.1, size:8  },
];

/* ── Particle SVG shapes ───────────────────────────────────────────────────── */

function PetalSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={Math.round(size*1.4)} viewBox="0 0 10 14">
      <ellipse cx="5" cy="7" rx="3.5" ry="6" fill="#f4b8c8" opacity="0.85" />
    </svg>
  );
}

function HeartSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 18">
      <path d="M10 16s-8-5.5-8-10.5C2 2.5 4 1 6.5 1c1.7 0 3 1 3.5 2 .5-1 1.8-2 3.5-2C16 1 18 2.5 18 5.5 18 10.5 10 16 10 16z" fill="#f4a0b0" opacity="0.9" />
    </svg>
  );
}

function SnowSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <line x1="6" y1="0" x2="6" y2="12" stroke="#b8d8f8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="6" x2="12" y2="6" stroke="#b8d8f8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1.8" y1="1.8" x2="10.2" y2="10.2" stroke="#b8d8f8" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.2" y1="1.8" x2="1.8" y2="10.2" stroke="#b8d8f8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ParticleShape({ type, size }: { type: string; size: number }) {
  if (type === "벚꽃" || type === "벚꽃잎") return <PetalSvg size={size} />;
  if (type === "하트") return <HeartSvg size={size} />;
  if (type === "눈송이") return <SnowSvg size={size} />;
  return null;
}

/* ── AnimatedParticle ──────────────────────────────────────────────────────── */

function AnimatedParticle({ type, left, delay, dur, size }: {
  type: string; left: string; delay: number; dur: number; size: number;
}) {
  const isHeart = type === "하트";
  const animName = isHeart ? "heart-rise" : type === "눈송이" ? "snow-fall" : "petal-fall";
  return (
    <div
      className="particle absolute"
      style={{
        left,
        ...(isHeart ? { bottom: "8%" } : { top: "-24px" }),
        animation: `${animName} ${dur}s ${delay}s infinite linear`,
        willChange: "transform, opacity",
      }}
    >
      <ParticleShape type={type} size={size} />
    </div>
  );
}

/* ── ParticleOverlay (full card) ───────────────────────────────────────────── */

function ParticleOverlay({ type }: { type: string }) {
  if (type === "없음" || !type) return null;
  const cfgs = type === "하트" ? HEART_CFG : type === "눈송이" ? SNOW_CFG : PETAL_CFG;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {cfgs.map((c, i) => (
        <AnimatedParticle key={i} type={type} left={c.left} delay={c.delay} dur={c.dur} size={c.size} />
      ))}
    </div>
  );
}

/* ── Visual effects (photo only) ──────────────────────────────────────────── */

function WaveOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 z-[2]">
      <svg viewBox="0 0 400 64" className="w-full h-full" preserveAspectRatio="none">
        <path d="M0 32 Q50 10 100 32 Q150 54 200 32 Q250 10 300 32 Q350 54 400 32 L400 64 L0 64Z" fill="rgba(255,255,255,0.32)" />
        <path d="M0 44 Q50 22 100 44 Q150 66 200 44 Q250 22 300 44 Q350 66 400 44 L400 64 L0 64Z" fill="rgba(255,255,255,0.22)" />
      </svg>
    </div>
  );
}

function FogOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2]"
      style={{
        background: "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, transparent 38%, transparent 62%, rgba(255,255,255,0.4) 100%)",
        backdropFilter: "blur(0.5px)",
      }}
    />
  );
}

/* ── Photo frame shapes ────────────────────────────────────────────────────── */

function getFrameStyle(shape: IntroShape): React.CSSProperties {
  if (shape === "아치") return { borderRadius: "50% 50% 0 0 / 80% 80% 0 0", overflow: "hidden" };
  return { borderRadius: "4px", overflow: "hidden" };
}

function PhotoBox({
  src, shape, photoEffect, className,
}: {
  src: string; shape: IntroShape; photoEffect: string; className?: string;
}) {
  const isFrame = shape === "액자";
  const inner = (
    <div className={`relative h-full w-full ${isFrame ? "" : ""}`} style={isFrame ? {} : getFrameStyle(shape)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="대표 사진" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#eae6e1]">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="6" y="10" width="36" height="28" rx="2" stroke="#c0b8b0" strokeWidth="1.8" />
            <circle cx="17" cy="20" r="3.5" stroke="#c0b8b0" strokeWidth="1.4" />
            <path d="M6 30 L16 22 L24 28 L32 20 L42 30" stroke="#c0b8b0" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {photoEffect === "물결" && <WaveOverlay />}
      {photoEffect === "안개" && <FogOverlay />}
    </div>
  );

  if (isFrame) {
    return (
      <div
        className={`overflow-hidden ${className ?? ""}`}
        style={{ padding: "8px", backgroundColor: "#fff", boxShadow: "0 0 0 1px #e8e0d8, 0 2px 10px rgba(0,0,0,0.07)", borderRadius: "6px" }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className ?? ""}`} style={getFrameStyle(shape)}>
      {inner}
    </div>
  );
}

/* ── 4 simplified template layouts ────────────────────────────────────────── */

function BasicLayout({ data, theme }: { data: InvitationData; theme: ThemeConfig }) {
  const di = parseDateInfo(data.weddingDate);
  const groom = data.groomName || `${data.groomLastName}${data.groomFirstName}` || "최신랑";
  const bride = data.brideName || `${data.brideLastName}${data.brideFirstName}` || "이신부";
  const venue = [data.venueName, data.venueHall].filter(Boolean).join(" ") || "더리버사이드 호텔";
  const first = data.brideFirstDisplay ? bride : groom;
  const second = data.brideFirstDisplay ? groom : bride;

  return (
    <div className="px-6 py-10 text-center">
      <p style={{ color: theme.light, letterSpacing: "0.22em" }} className="text-[10px] font-medium">SAVE THE DATE</p>
      <div style={{ color: theme.text }} className="mt-2 text-[22px] font-light tracking-[0.1em]">{di.heroDate}</div>
      <div style={{ color: theme.sub }} className="mt-1 text-[10px] tracking-[0.3em]">{di.weekdayEn}</div>

      <div className="mx-auto mt-7 w-full max-w-[230px]">
        <PhotoBox src={data.coverImage} shape={data.introShape} photoEffect={data.photoEffect} className="aspect-[3/4] w-full" />
      </div>

      <div style={{ color: theme.text }} className="mt-7 text-[16px] tracking-[-0.01em]">
        {first}<span style={{ color: theme.accent }} className="mx-3 text-[13px]">♥</span>{second}
      </div>
      <div className="mt-4 space-y-1">
        <p style={{ color: theme.sub }} className="text-[12px]">{di.fullDate} {di.weekdayKo}요일</p>
        <p style={{ color: theme.sub }} className="text-[12px]">{data.weddingPeriod} {data.weddingHour} {data.weddingMinute}</p>
        <p style={{ color: theme.light }} className="text-[12px]">{venue}</p>
      </div>
    </div>
  );
}

function PhotoFirstLayout({ data, theme }: { data: InvitationData; theme: ThemeConfig }) {
  const di = parseDateInfo(data.weddingDate);
  const groom = data.groomName || `${data.groomLastName}${data.groomFirstName}` || "최신랑";
  const bride = data.brideName || `${data.brideLastName}${data.brideFirstName}` || "이신부";
  const venue = [data.venueName, data.venueHall].filter(Boolean).join(" ") || "더리버사이드 호텔";
  const first = data.brideFirstDisplay ? bride : groom;
  const second = data.brideFirstDisplay ? groom : bride;

  return (
    <div className="text-center">
      <div className="px-6 pt-8 pb-4">
        <p style={{ color: theme.light }} className="text-[10px] tracking-[0.28em]">SAVE THE DATE</p>
        <div style={{ color: theme.text }} className="mt-2 text-[18px] font-light tracking-[0.06em]">{di.heroDate}</div>
      </div>

      <PhotoBox src={data.coverImage} shape={data.introShape} photoEffect={data.photoEffect} className="w-full aspect-[4/3]" />

      <div className="px-6 py-7">
        <div style={{ color: theme.text }} className="text-[17px] font-light">
          {first}<span style={{ color: theme.accent }} className="mx-3 text-[14px]">♥</span>{second}
        </div>
        <div className="mt-3 space-y-1">
          <p style={{ color: theme.sub }} className="text-[12px]">{di.fullDate} {di.weekdayKo}요일</p>
          <p style={{ color: theme.sub }} className="text-[12px]">{data.weddingPeriod} {data.weddingHour} {data.weddingMinute}</p>
          <p style={{ color: theme.light }} className="text-[12px]">{venue}</p>
        </div>
      </div>
    </div>
  );
}

function SaveTheDateLayout({ data, theme }: { data: InvitationData; theme: ThemeConfig }) {
  const di = parseDateInfo(data.weddingDate);
  const groom = data.groomName || `${data.groomLastName}${data.groomFirstName}` || "최신랑";
  const bride = data.brideName || `${data.brideLastName}${data.brideFirstName}` || "이신부";
  const first = data.brideFirstDisplay ? bride : groom;
  const second = data.brideFirstDisplay ? groom : bride;

  // poster with image background if photo exists
  if (data.coverImage) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.coverImage} alt="사진" className="absolute inset-0 h-full w-full object-cover" />
        {data.photoEffect === "물결" && <WaveOverlay />}
        {data.photoEffect === "안개" && <FogOverlay />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.45) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 pb-10 text-center">
          <p style={{ color: data.introTextColor || "#fff6a8", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }} className="text-[9px] tracking-[0.32em]">
            {data.introSubText || "SAVE THE DATE"}
          </p>
          <p style={{ color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.55)" }} className="mt-1.5 text-[20px] font-light tracking-[0.04em]">
            {data.introHeadline || "We're getting married"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }} className="text-[15px] font-light">{first}</span>
            <span style={{ color: data.introTextColor || "#fff6a8" }} className="text-[13px]">♥</span>
            <span style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }} className="text-[15px] font-light">{second}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.72)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }} className="mt-2 text-[11px] tracking-[0.12em]">
            {di.fullDate} {di.weekdayKo}요일
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-7 py-12 text-center">
      <p style={{ color: theme.accent }} className="text-[10px] tracking-[0.35em] font-medium">SAVE THE DATE</p>
      <h1 style={{ color: theme.text }} className="mt-3 text-[28px] font-extralight tracking-[0.06em] leading-tight">
        SAVE<br />THE DATE
      </h1>
      <div className="mt-4 flex items-center justify-center gap-2">
        <div style={{ height: "1px", width: "36px", backgroundColor: theme.accent, opacity: 0.55 }} />
        <span style={{ color: theme.accent }} className="text-[11px]">♥</span>
        <div style={{ height: "1px", width: "36px", backgroundColor: theme.accent, opacity: 0.55 }} />
      </div>
      <div style={{ color: theme.text }} className="mt-6 text-[18px] font-light">
        {first}<span style={{ color: theme.accent }} className="mx-3 text-[14px]">♥</span>{second}
      </div>
      <p style={{ color: theme.sub }} className="mt-3 text-[13px] tracking-[0.1em]">{di.heroDate}</p>
      <p style={{ color: theme.light }} className="mt-1 text-[11px] tracking-[0.25em]">{di.weekdayEn}</p>
    </div>
  );
}

function MinimalLayout({ data, theme }: { data: InvitationData; theme: ThemeConfig }) {
  const di = parseDateInfo(data.weddingDate);
  const groom = data.groomName || `${data.groomLastName}${data.groomFirstName}` || "최신랑";
  const bride = data.brideName || `${data.brideLastName}${data.brideFirstName}` || "이신부";
  const venue = [data.venueName, data.venueHall].filter(Boolean).join(" ") || "더리버사이드 호텔";
  const first = data.brideFirstDisplay ? bride : groom;
  const second = data.brideFirstDisplay ? groom : bride;

  return (
    <div className="px-8 py-12 text-center">
      <div style={{ color: theme.text }} className="text-[20px] font-light tracking-[-0.01em]">
        {first}
        <span style={{ color: theme.accent }} className="mx-3 text-[16px]">♥</span>
        {second}
      </div>
      <div className="mx-auto mt-3" style={{ width: "32px", height: "1px", backgroundColor: theme.accent, opacity: 0.5 }} />

      <div className="mx-auto mt-8 w-full max-w-[200px]">
        <PhotoBox src={data.coverImage} shape={data.introShape} photoEffect={data.photoEffect} className="aspect-square w-full" />
      </div>

      <div style={{ color: theme.text }} className="mt-8 text-[18px] font-light tracking-[0.08em]">{di.heroDate}</div>
      <p style={{ color: theme.sub }} className="mt-2 text-[11px] tracking-[0.25em]">{di.weekdayEn}</p>
      <div className="mt-4 space-y-1.5">
        <p style={{ color: theme.sub }} className="text-[12px]">{data.weddingPeriod} {data.weddingHour} {data.weddingMinute}</p>
        <p style={{ color: theme.light }} className="text-[12px]">{venue}</p>
      </div>
    </div>
  );
}

/* ── Main Export ───────────────────────────────────────────────────────────── */

type Props = { data: InvitationData };

export default function InvitationCard({ data }: Props) {
  const theme = getTheme(data.templateMood);
  const template: IntroTemplate = data.introTemplate || "basicDate";
  const legacyTemplate =
    template === "moment" || template === "basicDate"
      ? "basicDate"
      : template === "start" || template === "photoFirst"
        ? "photoFirst"
        : template === "together" || template === "goodday" || template === "saveTheDate"
          ? "saveTheDate"
          : "minimal";

  return (
    <article
      className="relative w-full overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      style={{ backgroundColor: theme.cardBg, borderRadius: "8px" }}
    >
      {/* Template content */}
      {legacyTemplate === "basicDate" && <BasicLayout data={data} theme={theme} />}
      {legacyTemplate === "photoFirst" && <PhotoFirstLayout data={data} theme={theme} />}
      {legacyTemplate === "saveTheDate" && <SaveTheDateLayout data={data} theme={theme} />}
      {legacyTemplate === "minimal" && <MinimalLayout data={data} theme={theme} />}

      {/* Particles float over full card */}
      <ParticleOverlay type={data.particle} />
    </article>
  );
}
