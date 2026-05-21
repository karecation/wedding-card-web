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

function parseDraft(raw: string): DraftEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if ("data" in parsed && ("slug" in parsed || "invitationId" in parsed)) {
        return parsed as DraftEnvelope;
      }
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

async function loadFromSupabase(identifier: string): Promise<SavedInvitation | null> {
  let fromDb = await getInvitationByIdAction(identifier);
  let source: "id" | "slug" | null = fromDb ? "id" : null;

  if (!fromDb) {
    fromDb = await getInvitationBySlugAction(identifier);
    source = fromDb ? "slug" : null;
  }

  console.log("[Preview supabase row]", {
    found: Boolean(fromDb),
    id: fromDb?.id,
    slug: fromDb?.slug,
    source,
  });

  if (!fromDb) return null;

  const imageRows = await getInvitationImagesAction(fromDb.id);
  console.log("[Preview image rows]", {
    count: imageRows.length,
    types: imageRows.map((row) => row.type),
  });

  return mergeInvitationImages(fromDb, imageRows);
}

export default function DraftPreviewPage() {
  const params = useParams<{ draftId: string }>();
  const [invitation, setInvitation] = useState<NormalizedInvitation | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!params.draftId) return;

    const load = async () => {
      const previewId = decodeURIComponent(params.draftId);
      console.log("[Preview load start]", { draftId: previewId });

      let merged = await loadFromSupabase(previewId);

      if (!merged) {
        const raw = window.localStorage.getItem(`invitation-draft-${previewId}`);
        const draft = raw ? parseDraft(raw) : null;
        console.log("[Preview fallback localStorage]", {
          used: Boolean(draft),
          slug: draft?.slug,
          invitationId: draft?.invitationId,
          hasInlineData: Boolean(draft?.data),
          rawSizeKb: raw ? Math.round(raw.length / 1024) : 0,
        });

        if (draft?.invitationId && draft.invitationId !== previewId) {
          merged = await loadFromSupabase(draft.invitationId);
        }
        if (!merged && draft?.slug && draft.slug !== previewId) {
          merged = await loadFromSupabase(draft.slug);
        }
        if (!merged && draft?.data) {
          merged = draft.data;
        }
      }

      if (!merged) {
        console.warn("[Preview not found]", { draftId: previewId });
        setMissing(true);
        return;
      }

      const normalized = normalizeInvitation(merged);
      console.log("[Preview final data]", {
        id: normalized.id,
        slug: normalized.slug,
        hasMainImageUrl: Boolean(normalized.intro.mainImageUrl),
        galleryImageCount: normalized.gallery.images.length,
        hasPhotoQuote: Boolean(normalized.quote.imageUrl),
        hasShareThumbnail: Boolean(normalized.share.kakaoThumbnailUrl || normalized.share.urlThumbnailUrl),
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
            저장된 데이터가 없거나 아직 공개되지 않은 주소입니다. 제작 화면에서 다시 저장해주세요.
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
