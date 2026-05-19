"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
// NOTE: this file uses InvitationRenderer as the single public renderer
import { addGuestbookAction, getInvitationBySlugAction, submitRsvpAction } from "@/app/actions/invitationActions";
import InvitationRenderer from "@/components/invitation/InvitationRenderer";
import type { GuestbookEntry } from "@/components/invitation/GuestbookSection";
import { emptyInvitationData, type SavedInvitation } from "@/types/invitation";

const collectionKey = "mobile-wedding-invitations";

function readLocalInvitation(slug: string): SavedInvitation | null {
  const raw = window.localStorage.getItem(collectionKey);
  if (!raw) return null;
  try {
    const list = JSON.parse(raw) as SavedInvitation[];
    const found = list.find((item) => item.slug === slug);
    return found ? { ...emptyInvitationData, ...found } : null;
  } catch {
    window.localStorage.removeItem(collectionKey);
    return null;
  }
}

export default function SharedInvitationPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);
  const [invitation, setInvitation] = useState<SavedInvitation | null>(null);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  if (!isLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-5">
        <p className="text-[13px] text-[#9d8a80]">청첩장을 불러오는 중입니다</p>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-5 text-center">
        <div className="w-full max-w-sm rounded-[18px] border border-[#eaded3] bg-white px-7 py-9">
          <p className="text-[10px] tracking-[0.3em] text-[#bba69b]">SAVE THE DATE</p>
          <h1 className="mt-4 text-[20px] font-light text-[#34251f]">청첩장을 찾을 수 없습니다</h1>
          <p className="mt-3 text-[13px] leading-7 text-[#8d7a72]">
            저장된 데이터가 없거나 아직 공개되지 않은 주소입니다.
          </p>
          <Link href="/create" className="mt-6 inline-flex h-10 items-center rounded-full bg-[#c9897a] px-6 text-[13px] font-medium text-white">
            청첩장 만들기
          </Link>
        </div>
      </main>
    );
  }

  if (!invitation.isPublished) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-5 text-center">
        <div className="w-full max-w-sm rounded-[18px] border border-[#eaded3] bg-white px-7 py-9">
          <h1 className="text-[20px] font-light text-[#34251f]">비공개 청첩장입니다</h1>
        </div>
      </main>
    );
  }

  const handleRsvp = async (form: {
    guest_name: string;
    phone_last4: string;
    attending: boolean;
    meal: boolean;
    companions: number;
    message: string;
  }) => {
    await submitRsvpAction(invitation.id, form);
  };

  const handleGuestbook = async (entry: { guest_name: string; message: string }) => {
    await addGuestbookAction(invitation.id, entry);
    const nextEntry: GuestbookEntry = {
      guestName: entry.guest_name,
      message: entry.message,
      createdAt: new Date().toISOString(),
    };
    const next = [nextEntry, ...guestbook];
    setGuestbook(next);
    window.localStorage.setItem(`guestbook-${slug}`, JSON.stringify(next));
  };

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-0 py-0 sm:py-6">
      <InvitationRenderer
        invitation={invitation}
        mode="public"
        guestbookEntries={guestbook}
        onRsvpSubmit={handleRsvp}
        onGuestbookSubmit={handleGuestbook}
      />
    </main>
  );
}
