"use client";

import KakaoMap from "@/components/invitation/KakaoMap";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

function mapLink(provider: "naver" | "kakao" | "tmap", venueName: string, address: string) {
  const query = encodeURIComponent([venueName, address].filter(Boolean).join(" "));
  if (provider === "naver") return `https://map.naver.com/v5/search/${query}`;
  if (provider === "kakao") return `https://map.kakao.com/link/search/${query}`;
  return `https://www.tmap.co.kr/tmap2/mobile/route.jsp?name=${query}`;
}

export default function LocationSection({ invitation }: { invitation: NormalizedInvitation }) {
  if (!invitation.location.enabled) return null;

  const venue = [invitation.location.venueName, invitation.location.hallName || invitation.location.hall].filter(Boolean).join(" ");
  const visibleTransport = invitation.location.transportations.filter((item) => item.title || item.body);

  console.log("[LocationSection data]", {
    venueName: invitation.location.venueName,
    hallName: invitation.location.hallName || invitation.location.hall,
    address: invitation.location.address,
    lat: invitation.location.lat,
    lng: invitation.location.lng,
  });

  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">LOCATION</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.location.title}</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>

      <div className="mt-8 text-center">
        <p className="whitespace-nowrap text-[15px] text-[var(--invite-text)]">{venue || "예식장 정보를 입력해 주세요"}</p>
        {invitation.location.address && <p className="mt-2 text-[12px] leading-6 text-[var(--invite-muted)]">{invitation.location.address}</p>}
      </div>

      {invitation.location.showMap && (
        <div className="mt-6 overflow-hidden rounded-[12px] border border-[var(--invite-border)] bg-[#f1eee9]">
          <KakaoMap
            venueName={invitation.location.venueName}
            address={invitation.location.address}
            lat={invitation.location.lat}
            lng={invitation.location.lng}
            height={260}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <a href={mapLink("naver", venue, invitation.location.address)} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--invite-border)] py-2 text-center text-[12px] text-[var(--invite-text)]">
          네이버 지도
        </a>
        <a href={mapLink("kakao", venue, invitation.location.address)} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--invite-border)] py-2 text-center text-[12px] text-[var(--invite-text)]">
          카카오 내비
        </a>
        <a href={mapLink("tmap", venue, invitation.location.address)} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--invite-border)] py-2 text-center text-[12px] text-[var(--invite-text)]">
          티맵
        </a>
      </div>

      {visibleTransport.length > 0 && (
        <div className="mt-8 space-y-4">
          {visibleTransport.map((item) => (
            <div key={item.id} className="rounded-[12px] border border-[var(--invite-border)] bg-white/50 px-4 py-3">
              <p className="text-[13px] font-medium text-[var(--invite-text)]">{item.title}</p>
              {item.body && <p className="mt-1 whitespace-pre-line text-[12px] leading-6 text-[var(--invite-muted)]">{item.body}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
