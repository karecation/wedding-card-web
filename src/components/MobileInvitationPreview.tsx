"use client";

import CopyAccountButton from "@/components/CopyAccountButton";
import InvitationSection from "@/components/InvitationSection";
import MapButton from "@/components/MapButton";
import type { InvitationData } from "@/types/invitation";

type MobileInvitationPreviewProps = {
  data: InvitationData;
  compact?: boolean;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80";

const moodStyles = {
  클래식: {
    page: "bg-[#fffaf2]",
    accent: "#d4b981",
    soft: "#f2e5cf",
    deep: "#2d2926",
  },
  로맨틱: {
    page: "bg-[#fff5f3]",
    accent: "#c9808c",
    soft: "#f1d4d2",
    deep: "#59333a",
  },
  모던: {
    page: "bg-[#f6f1e8]",
    accent: "#8fa7b6",
    soft: "#dfe8ea",
    deep: "#2d2926",
  },
  럭셔리: {
    page: "bg-[#f8f1e4]",
    accent: "#7a4960",
    soft: "#e7d6ba",
    deep: "#251d22",
  },
  내추럴: {
    page: "bg-[#f5f2e8]",
    accent: "#8f9f82",
    soft: "#e1dfcf",
    deep: "#303329",
  },
};

function formatDate(date: string) {
  if (!date) return "예식 날짜";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string) {
  if (!time) return "예식 시간";
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute));
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function MobileInvitationPreview({ data, compact = false }: MobileInvitationPreviewProps) {
  const style = moodStyles[data.templateMood];
  const names =
    data.groomName || data.brideName
      ? `${data.groomName || "신랑"} 그리고 ${data.brideName || "신부"}`
      : "신랑 그리고 신부";

  return (
    <article className={`mx-auto w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#e5dac9] bg-[#fffdf8] shadow-[0_28px_80px_rgba(72,57,40,0.18)] ${compact ? "max-h-[calc(100vh-10rem)] overflow-y-auto" : ""}`}>
      <div className={`${style.page} min-h-screen`}>
        <header className="relative min-h-[610px] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-32 w-2/3"
            style={{ backgroundColor: style.soft }}
          />
          <div
            className="absolute right-0 top-24 h-44 w-24"
            style={{ backgroundColor: style.accent, opacity: 0.38 }}
          />
          <div className="absolute left-7 top-8 z-10 text-[10px] uppercase tracking-[0.38em] text-[#fbf7ef] mix-blend-difference">
            Mobile Wedding Invitation
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.coverImage || fallbackImage}
            alt="웨딩 대표 사진"
            className="absolute left-6 right-6 top-20 h-[420px] w-[calc(100%-3rem)] rounded-t-[9rem] object-cover shadow-[0_20px_45px_rgba(45,41,38,0.16)]"
          />
          <div className="absolute inset-x-7 bottom-0 bg-[#fbf7ef]/90 px-6 py-8 text-center backdrop-blur-sm">
            <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: style.accent }}>
              결혼합니다
            </p>
            <h1 className="font-serif text-4xl leading-tight" style={{ color: style.deep }}>
              {names}
            </h1>
            <p className="mt-5 text-sm tracking-[0.14em] text-[#6f6254]">{formatDate(data.weddingDate)}</p>
          </div>
        </header>

        <InvitationSection eyebrow={data.templateMood} title="초대합니다">
          <p className="mx-auto max-w-xs whitespace-pre-line text-center text-[15px] leading-8 text-[#6f6254]">
            {data.message ||
              "서로의 계절이 되어 오래도록 함께 걸어가려 합니다. 소중한 걸음으로 축복해 주세요."}
          </p>
        </InvitationSection>

        <div className="mx-6 h-px bg-[#e4d8c6]" />

        <InvitationSection eyebrow="Ceremony" title={formatDate(data.weddingDate)}>
          <div className="space-y-3 text-center text-[#6f6254]">
            <p className="text-xl font-medium text-[#2d2926]">{formatTime(data.weddingTime)}</p>
            <p className="font-medium text-[#4c433b]">{data.venueName || "예식장 이름"}</p>
            <p className="mx-auto max-w-xs text-sm leading-6">{data.venueAddress || "예식장 주소"}</p>
          </div>
          <div className="pt-2">
            <MapButton href={data.mapLink} />
          </div>
        </InvitationSection>

        <div className="mx-6 h-px bg-[#e4d8c6]" />

        <InvitationSection eyebrow="Gallery" title="우리의 순간">
          {data.galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.galleryImages.map((image, index) => (
                <div
                  key={`${image.slice(0, 30)}-${index}`}
                  className={`overflow-hidden rounded-lg border border-[#eadfce] ${
                    index === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#d8c7aa] px-5 py-10 text-center text-sm text-[#756a5c]">
              갤러리 사진이 여기에 표시됩니다.
            </div>
          )}
        </InvitationSection>

        <div className="mx-6 h-px bg-[#e4d8c6]" />

        <InvitationSection eyebrow="Gift" title="마음 전하실 곳">
          <div className="space-y-3">
            <CopyAccountButton label="신랑측" account={data.groomAccount} />
            <CopyAccountButton label="신부측" account={data.brideAccount} />
          </div>
        </InvitationSection>

        <div className="mx-6 h-px bg-[#e4d8c6]" />

        <InvitationSection eyebrow="RSVP" title="참석 의사를 전해주세요">
          <div className="grid gap-3">
            <div className="rounded-lg border border-[#e3d5bf] bg-[#fffdf8] px-5 py-5 text-center text-sm text-[#756a5c]">
              참석 여부 RSVP 영역
            </div>
            <div className="rounded-lg border border-[#e3d5bf] bg-[#fffdf8] px-5 py-5 text-center text-sm text-[#756a5c]">
              방명록 영역
            </div>
          </div>
        </InvitationSection>

        {data.musicUrl && (
          <div className="px-6 pb-10">
            <audio src={data.musicUrl} controls className="w-full" />
          </div>
        )}
      </div>
    </article>
  );
}
