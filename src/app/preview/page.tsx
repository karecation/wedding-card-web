"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileInvitationPreview from "@/components/MobileInvitationPreview";
import { emptyInvitationData, type InvitationData } from "@/types/invitation";

const storageKey = "mobile-wedding-invitation";

export default function PreviewPage() {
  const [invitation, setInvitation] = useState<InvitationData>(emptyInvitationData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedInvitation = window.localStorage.getItem(storageKey);

    if (savedInvitation) {
      try {
        setInvitation({ ...emptyInvitationData, ...JSON.parse(savedInvitation) });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setLoaded(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#eee3d2] px-4 py-6 text-[#2d2926] sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-8 lg:h-fit">
          <Link href="/create" className="text-sm uppercase tracking-[0.22em] text-[#8b6c41]">
            편집기로 돌아가기
          </Link>
          <div className="rounded-lg border border-[#dac9ae] bg-[#fbf7ef] p-6 shadow-[0_18px_50px_rgba(72,57,40,0.08)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#9a7b4f]">Mobile preview</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight">완성된 청첩장을 확인해 주세요.</h1>
            <p className="mt-4 text-sm leading-7 text-[#6f6254]">
              현재 MVP는 업로드 이미지와 입력 정보를 브라우저 localStorage에 임시 저장합니다.
            </p>
          </div>
        </aside>

        <section className="flex justify-center">
          {loaded && <MobileInvitationPreview data={invitation} />}
        </section>
      </div>
    </main>
  );
}
