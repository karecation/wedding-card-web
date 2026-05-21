"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getInvitationByIdAction,
  getInvitationBySlugAction,
  getInvitationImagesAction,
} from "@/app/actions/invitationActions";
import InvitationRenderer from "@/components/invitation/InvitationRenderer";
import { mergeInvitationImages } from "@/lib/invitation/mergeInvitationImages";
import { normalizeInvitation, type NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";
import type { SavedInvitation } from "@/types/invitation";

type DraftEnvelope = {
  draftId?: string;
  slug?: string;
  invitationId?: string;
  savedAt?: string;
  data?: SavedInvitation | null;
};

// 구버전 draft(SavedInvitation 자체)와 신버전 envelope을 모두 지원
function parseDraft(raw: string): DraftEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // 신버전: envelope ({ draftId, slug, invitationId, data })
      if ("data" in parsed && ("slug" in parsed || "invitationId" in parsed)) {
        return parsed as DraftEnvelope;
      }
      // 구버전: SavedInvitation 자체
      const old = parsed as SavedInvitation;
      return {
        slug: old.slug,
        invitationId: old.id,
        data: old,
      };
    }
    return null;
  } catch (error) {
    console.error("[Preview draft parse failed]", error);
    return null;
  }
}

export default function DraftPreviewPage() {
  const params = useParams<{ draftId: string }>();
  const [invitation, setInvitation] = useState<NormalizedInvitation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!params.draftId) return;

    const load = async () => {
      console.log("[Preview load start]", { draftId: params.draftId });

      const raw = window.localStorage.getItem(`invitation-draft-${params.draftId}`);
      const draft = raw ? parseDraft(raw) : null;

      console.log("[Preview draft from localStorage]", {
        hasDraft: Boolean(draft),
        slug: draft?.slug,
        invitationId: draft?.invitationId,
        hasInlineData: Boolean(draft?.data),
        rawSizeKb: raw ? Math.round(raw.length / 1024) : 0,
      });

      // 1순위: Supabase 조회 (slug 또는 invitationId 기준)
      let merged: SavedInvitation | null = null;
      let supabaseSource: "id" | "slug" | null = null;

      if (draft?.invitationId || draft?.slug) {
        try {
          let fromDb: SavedInvitation | null = null;
          if (draft.invitationId) {
            fromDb = await getInvitationByIdAction(draft.invitationId);
            if (fromDb) supabaseSource = "id";
          }
          if (!fromDb && draft.slug) {
            fromDb = await getInvitationBySlugAction(draft.slug);
            if (fromDb) supabaseSource = "slug";
          }

          if (fromDb) {
            console.log("[Preview Supabase invitation loaded]", {
              id: fromDb.id,
              slug: fromDb.slug,
              via: supabaseSource,
            });

            const imageRows = await getInvitationImagesAction(fromDb.id);
            const byType = imageRows.reduce<Record<string, number>>((acc, row) => {
              acc[row.type] = (acc[row.type] ?? 0) + 1;
              return acc;
            }, {});
            console.log("[Preview image rows loaded]", { count: imageRows.length, byType });

            merged = mergeInvitationImages(fromDb, imageRows);

            console.log("[Preview image merge]", {
              hasMainImage: Boolean(merged.coverImage),
              galleryCount: merged.galleryItems.length,
              hasPhotoQuote: Boolean(merged.quoteImage),
              hasShareThumbnail: Boolean(merged.kakaoThumbnailUrl || merged.urlThumbnailUrl),
            });
          }
        } catch (error) {
          console.error("[Preview Supabase fetch failed]", error);
        }
      }

      // 2순위: localStorage 데이터 fallback
      if (!merged && draft?.data) {
        console.log("[Preview fallback localStorage used]", { reason: "Supabase 미설정 또는 조회 실패" });
        merged = draft.data;
      }

      if (!merged) {
        console.warn("[Preview not found]", { draftId: params.draftId });
        setMissing(true);
        return;
      }

      const normalized = normalizeInvitation(merged);

      console.log("[Preview render data]", {
        slug: normalized.slug,
        id: normalized.id,
        coverImage: normalized.intro.mainImageUrl
          ? normalized.intro.mainImageUrl.slice(0, 60) + "..."
          : "(없음)",
        galleryEnabled: normalized.gallery.enabled,
        galleryImageCount: normalized.gallery.images.length,
        galleryImageUrls: normalized.gallery.images.map((img) => ({
          id: img.id,
          urlType: img.url?.startsWith("https://")
            ? "https"
            : img.url?.startsWith("data:")
              ? "base64"
              : img.url
                ? "other"
                : "empty",
          urlPrefix: (img.url || img.previewUrl || img.dataUrl || "").slice(0, 50),
        })),
      });

      setInvitation(normalized);
    };

    load();
  }, [params.draftId]);

  if (missing) {
    return (
      <main className="min-h-dvh bg-[#f5f2ef] px-5 py-16 text-center text-[#2f2825]">
        <div className="mx-auto max-w-[430px] rounded-[18px] bg-white px-6 py-12 shadow-sm ring-1 ring-[#eaded5]">
          <h1 className="text-[20px] font-semibold">저장된 미리보기를 찾을 수 없습니다</h1>
          <p className="mt-3 text-[13px] leading-6 text-[#8a7a70]">
            브라우저에 저장된 draft가 없거나 만료되었습니다. 제작 화면에서 다시 저장해주세요.
          </p>
          <Link
            href="/create"
            className="mt-7 inline-flex h-10 items-center rounded-full border border-[#d9c7bc] px-5 text-[13px] font-semibold"
          >
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
