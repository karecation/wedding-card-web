"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import InvitationRenderer from "@/components/invitation/InvitationRenderer";
import { normalizeInvitation, type NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export default function DraftPreviewPage() {
  const params = useParams<{ draftId: string }>();
  const [invitation, setInvitation] = useState<NormalizedInvitation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!params.draftId) return;

    try {
      const raw = window.localStorage.getItem(`invitation-draft-${params.draftId}`);
      console.log("[Preview load] draft 조회", {
        draftId: params.draftId,
        found: Boolean(raw),
        rawSizeKb: raw ? Math.round(raw.length / 1024) : 0,
      });
      if (!raw) {
        setMissing(true);
        return;
      }
      const parsed = JSON.parse(raw);
      const normalized = normalizeInvitation(parsed);
      console.log("[Preview load] invitation data", {
        slug: normalized.slug,
        id: normalized.id,
        coverImage: normalized.intro.mainImageUrl ? normalized.intro.mainImageUrl.slice(0, 60) + "..." : "(없음)",
        galleryEnabled: normalized.gallery.enabled,
        galleryImageCount: normalized.gallery.images.length,
        galleryImageUrls: normalized.gallery.images.map((img) => ({
          id: img.id,
          urlType: img.url?.startsWith("https://") ? "https" : img.url?.startsWith("data:") ? "base64" : img.url ? "other" : "empty",
          urlPrefix: (img.url || img.previewUrl || img.dataUrl || "").slice(0, 50),
        })),
      });
      setInvitation(normalized);
    } catch (error) {
      console.error("[Preview load] 파싱 실패", error);
      setMissing(true);
    }
  }, [params.draftId]);

  if (missing) {
    return (
      <main className="min-h-dvh bg-[#f5f2ef] px-5 py-16 text-center text-[#2f2825]">
        <div className="mx-auto max-w-[430px] rounded-[18px] bg-white px-6 py-12 shadow-sm ring-1 ring-[#eaded5]">
          <h1 className="text-[20px] font-semibold">저장된 미리보기를 찾을 수 없습니다</h1>
          <p className="mt-3 text-[13px] leading-6 text-[#8a7a70]">브라우저에 저장된 draft가 없거나 만료되었습니다. 제작 화면에서 다시 저장해주세요.</p>
          <Link href="/create" className="mt-7 inline-flex h-10 items-center rounded-full border border-[#d9c7bc] px-5 text-[13px] font-semibold">
            제작 화면으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return <main className="min-h-dvh bg-[#f5f2ef]" />;
  }

  return (
    <main className="min-h-dvh bg-[#f5f2ef] px-0 py-0 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-[430px] bg-white shadow-[0_16px_40px_rgba(68,50,40,0.08)] sm:overflow-hidden sm:rounded-[24px]">
        <InvitationRenderer invitation={invitation} mode="public" />
      </div>
    </main>
  );
}
