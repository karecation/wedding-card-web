"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MobileInvitationPreview from "@/components/MobileInvitationPreview";
import { addGuestbookAction, getInvitationBySlugAction, submitRsvpAction } from "@/app/actions/invitationActions";
import { emptyInvitationData, type SavedInvitation } from "@/types/invitation";

const collectionKey = "mobile-wedding-invitations";

type GuestbookEntry = {
  guestName: string;
  message: string;
  createdAt: string;
};

function readLocalInvitation(slug: string): SavedInvitation | null {
  const raw = window.localStorage.getItem(collectionKey);
  if (!raw) return null;

  try {
    const invitations = JSON.parse(raw) as SavedInvitation[];
    const found = invitations.find((item) => item.slug === slug);
    return found ? { ...emptyInvitationData, ...found } : null;
  } catch {
    window.localStorage.removeItem(collectionKey);
    return null;
  }
}

export default function SharedInvitationPage() {
  const params = useParams<{ slug: string }>();
  const [invitation, setInvitation] = useState<SavedInvitation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showRsvp, setShowRsvp] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [guestbookMessage, setGuestbookMessage] = useState("");

  const slug = decodeURIComponent(params.slug);

  useEffect(() => {
    const load = async () => {
      const fromSupabase = await getInvitationBySlugAction(slug);
      const loaded = fromSupabase ?? readLocalInvitation(slug);
      setInvitation(loaded);
      const rawGuestbook = window.localStorage.getItem(`guestbook-${slug}`);
      setGuestbook(rawGuestbook ? JSON.parse(rawGuestbook) : []);
      setIsLoaded(true);
    };

    load();
  }, [slug]);

  const visibleSections = useMemo(() => invitation?.menuOrder.filter((item) => item.enabled) ?? [], [invitation]);

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-5 text-[#111]">
        <p className="text-[13px] text-[#777]">청첩장을 불러오는 중입니다</p>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-5 text-center text-[#111]">
        <section className="w-full max-w-sm border border-[#e5e5e5] bg-white p-8">
          <p className="text-[11px] tracking-[0.24em] text-[#aaa]">INVITATION</p>
          <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.04em]">청첩장을 찾을 수 없습니다</h1>
          <p className="mt-4 text-[13px] leading-7 text-[#777]">저장된 청첩장 데이터가 없거나 아직 공개되지 않았습니다.</p>
          <Link href="/create" className="mt-6 inline-flex h-10 items-center rounded bg-[#f49a79] px-5 text-[13px] font-semibold text-white">
            청첩장 만들기
          </Link>
        </section>
      </main>
    );
  }

  if (!invitation.isPublished) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-5 text-center text-[#111]">
        <section className="w-full max-w-sm border border-[#e5e5e5] bg-white p-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.04em]">비공개 청첩장입니다</h1>
        </section>
      </main>
    );
  }

  const saveRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await submitRsvpAction(invitation.id, {
      guest_name: String(form.get("guestName") ?? ""),
      phone_last4: String(form.get("phoneLast4") ?? ""),
      attending: form.get("attending") === "yes",
      meal: form.get("meal") === "yes",
      companions: Number(form.get("companions") ?? 0),
      message: String(form.get("message") ?? ""),
    });
    setRsvpMessage("참석 의사가 전달되었습니다");
    event.currentTarget.reset();
  };

  const saveGuestbook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = {
      guestName: String(form.get("guestName") ?? ""),
      message: String(form.get("message") ?? ""),
      createdAt: new Date().toISOString(),
    };
    await addGuestbookAction(invitation.id, { guest_name: entry.guestName, message: entry.message });
    const next = [entry, ...guestbook];
    setGuestbook(next);
    window.localStorage.setItem(`guestbook-${slug}`, JSON.stringify(next));
    setGuestbookMessage("방명록이 등록되었습니다");
    event.currentTarget.reset();
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#111]">
      <div className="mx-auto max-w-[430px] space-y-4">
        <MobileInvitationPreview data={invitation} />

        {visibleSections.map((section) => {
          if (section.id === "location" && invitation.showMap) {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-6 py-8 text-center">
                <h2 className="text-[18px]">{invitation.venueTitle}</h2>
                <p className="mt-3 text-[13px] leading-6 text-[#666]">{invitation.venueName} {invitation.venueHall}</p>
                <p className="text-[12px] leading-6 text-[#888]">{invitation.venueAddress || "주소가 입력되지 않았습니다"}</p>
                <div className="mt-4 grid h-52 place-items-center border border-[#ddd] bg-[#f8f8f8] text-[12px] text-[#777]">
                  {invitation.latitude && invitation.longitude ? "지도 좌표가 저장되었습니다" : "지도 API 키가 없거나 좌표가 없습니다"}
                </div>
              </section>
            );
          }

          if (section.id === "gallery" && invitation.galleryItems.length > 0) {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-5 py-8">
                <h2 className="text-center text-[18px]">{invitation.galleryTitle}</h2>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {invitation.galleryItems.map((image) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={image.id} src={image.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  ))}
                </div>
              </section>
            );
          }

          if (section.id === "video" && invitation.youtubeVideoId) {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-5 py-8">
                <div className="aspect-video overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${invitation.youtubeVideoId}`}
                    title="웨딩 동영상"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            );
          }

          if (section.id === "accounts" && invitation.bankAccounts.some((account) => account.accountNumber && !account.hidden)) {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-6 py-8">
                <h2 className="text-center text-[18px]">마음 전하실 곳</h2>
                <div className="mt-5 space-y-2">
                  {invitation.bankAccounts.filter((account) => account.accountNumber && !account.hidden).map((account) => (
                    <button key={account.id} type="button" onClick={() => navigator.clipboard.writeText(`${account.bankName} ${account.accountNumber} ${account.accountHolder}`)} className="w-full border border-[#e5e5e5] px-4 py-3 text-left text-[13px]">
                      <span className="block text-[#888]">{account.groupName}</span>
                      {account.bankName} {account.accountNumber} {account.accountHolder}
                    </button>
                  ))}
                </div>
              </section>
            );
          }

          if (section.id === "rsvp") {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-6 py-8">
                <h2 className="text-center text-[18px]">{invitation.rsvpTitle}</h2>
                <p className="mt-3 whitespace-pre-line text-center text-[13px] leading-7 text-[#666]">{invitation.rsvpDescription}</p>
                <button type="button" onClick={() => setShowRsvp((value) => !value)} className="mt-5 h-10 w-full rounded bg-[#f49a79] text-[13px] font-semibold text-white">{invitation.rsvpButtonLabel}</button>
                {showRsvp && (
                  <form onSubmit={saveRsvp} className="mt-4 space-y-2">
                    <input name="guestName" required placeholder="이름" className="h-10 w-full border px-3 text-[13px]" />
                    <input name="phoneLast4" placeholder="연락처 뒤 4자리" className="h-10 w-full border px-3 text-[13px]" />
                    <select name="attending" className="h-10 w-full border px-3 text-[13px]"><option value="yes">참석</option><option value="no">불참</option></select>
                    <select name="meal" className="h-10 w-full border px-3 text-[13px]"><option value="yes">식사함</option><option value="no">식사 안함</option></select>
                    <input name="companions" type="number" min="0" placeholder="동행인 수" className="h-10 w-full border px-3 text-[13px]" />
                    <textarea name="message" placeholder="전달사항" className="w-full border px-3 py-2 text-[13px]" />
                    <button className="h-10 w-full border border-[#111] text-[13px]">전달하기</button>
                    {rsvpMessage && <p className="text-center text-[12px] text-[#f06f52]">{rsvpMessage}</p>}
                  </form>
                )}
              </section>
            );
          }

          if (section.id === "guestbook") {
            return (
              <section key={section.id} className="border border-[#e5e5e5] bg-white px-6 py-8">
                <h2 className="text-center text-[18px]">{invitation.guestbookTitle}</h2>
                <form onSubmit={saveGuestbook} className="mt-5 space-y-2">
                  <input name="guestName" required placeholder="이름" className="h-10 w-full border px-3 text-[13px]" />
                  <textarea name="message" required placeholder="축하 메시지" className="w-full border px-3 py-2 text-[13px]" />
                  <button className="h-10 w-full border border-[#111] text-[13px]">남기기</button>
                </form>
                {guestbookMessage && <p className="mt-3 text-center text-[12px] text-[#f06f52]">{guestbookMessage}</p>}
                <div className="mt-5 space-y-2">
                  {guestbook.map((entry) => (
                    <div key={`${entry.createdAt}-${entry.guestName}`} className="border border-[#eee] px-3 py-2 text-[13px]">
                      <p className="font-semibold">{entry.guestName}</p>
                      <p className="mt-1 text-[#666]">{entry.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {invitation.audioUrl && (
          <section className="border border-[#e5e5e5] bg-white px-6 py-5">
            <audio src={invitation.audioUrl} controls className="w-full" />
            <p className="mt-2 text-[11px] text-[#999]">업로드한 음원의 저작권 책임은 사용자에게 있습니다.</p>
          </section>
        )}

        <button type="button" onClick={() => navigator.clipboard.writeText(window.location.href)} className="h-10 w-full rounded bg-[#111] text-[13px] font-semibold text-white">
          URL 복사
        </button>
      </div>
    </main>
  );
}
