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
    <main className="min-h-screen bg-[#f7f7f7] px-4 py-6 text-[#111]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5">
        <Link href="/create" className="self-start text-[13px] text-[#555]">
          편집기로 돌아가기
        </Link>
        {loaded && <MobileInvitationPreview data={invitation} />}
      </div>
    </main>
  );
}
