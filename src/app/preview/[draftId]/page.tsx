"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createPurchaseSessionAction,
  getInvitationByIdAction,
  getInvitationBySlugAction,
  getInvitationImagesAction,
} from "@/app/actions/invitationActions";
import InvitationRenderer from "@/components/invitation/InvitationRenderer";
import { mergeInvitationImages } from "@/lib/invitation/mergeInvitationImages";
import { normalizeInvitation, type NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";
import { readLocalInvitation } from "@/lib/localInvitations";
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
      if ("data" in parsed && ("slug" in parsed || "invitationId" in parsed)) return parsed as DraftEnvelope;
      const old = parsed as SavedInvitation;
      return { slug: old.slug, invitationId: old.id, data: old };
    }
    return null;
  } catch (error) {
    console.error("[Preview draft parse failed]", error);
    return null;
  }
}

async function loadBaseFromSupabase(identifier: string): Promise<SavedInvitation | null> {
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

  return fromDb;
}

async function mergeRemoteImages(invitation: SavedInvitation): Promise<SavedInvitation> {
  const imageRows = await getInvitationImagesAction(invitation.id);
  console.log("[Preview image rows]", {
    count: imageRows.length,
    types: imageRows.map((row) => row.type),
  });
  return mergeInvitationImages(invitation, imageRows);
}

function buildPurchaseUrl(storeUrl: string, invitationId: string, slug: string) {
  try {
    const url = new URL(storeUrl);
    url.searchParams.set("invitation_id", invitationId);
    url.searchParams.set("slug", slug);
    return url.toString();
  } catch {
    const separator = storeUrl.includes("?") ? "&" : "?";
    return `${storeUrl}${separator}invitation_id=${encodeURIComponent(invitationId)}&slug=${encodeURIComponent(slug)}`;
  }
}

export default function DraftPreviewPage() {
  const params = useParams<{ draftId: string }>();
  const [invitation, setInvitation] = useState<NormalizedInvitation | null>(null);
  const [missing, setMissing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const storeUrl = process.env.NEXT_PUBLIC_NAVER_STORE_PRODUCT_URL ?? "";

  useEffect(() => {
    if (!params.draftId) return;
    let cancelled = false;
    let renderedOnce = false;

    const previewId = decodeURIComponent(params.draftId);

    const renderInvitation = (nextInvitation: SavedInvitation, source: string) => {
      if (cancelled) return;
      console.log("[PREVIEW] loaded invitation:", nextInvitation);
      const normalized = normalizeInvitation(nextInvitation);
      console.log("[PREVIEW_IMAGE_COUNT]", normalized.gallery.images.length);
      console.log("[PREVIEW_MAIN_IMAGE_TYPE]", normalized.intro.mainImageUrl?.slice(0, 30));
      console.log("[Preview final data]", {
        source,
        id: normalized.id,
        slug: normalized.slug,
        hasMainImageUrl: Boolean(normalized.intro.mainImageUrl),
        galleryImageCount: normalized.gallery.images.length,
        hasPhotoQuote: Boolean(normalized.quote.imageUrl),
        hasShareThumbnail: Boolean(normalized.share.kakaoThumbnailUrl || normalized.share.urlThumbnailUrl),
      });
      setInvitation(normalized);
      setMissing(false);
      renderedOnce = true;
    };

    const load = async () => {
      console.log("[Preview load start]", { draftId: previewId });
      console.time("[PREVIEW_LOAD_DATA]");

      const localInvitation = readLocalInvitation(previewId);
      if (localInvitation) {
        console.log("[Preview immediate local render]", { id: localInvitation.id, slug: localInvitation.slug });
        renderInvitation(localInvitation, "local-cache");
      }

      let remoteBase = await loadBaseFromSupabase(previewId);

      if (!remoteBase && !localInvitation) {
        const raw = window.localStorage.getItem(`invitation-draft-${previewId}`);
        const draft = raw ? parseDraft(raw) : null;
        console.log("[Preview fallback localStorage]", {
          used: Boolean(draft),
          slug: draft?.slug,
          invitationId: draft?.invitationId,
          hasInlineData: Boolean(draft?.data),
          rawSizeKb: raw ? Math.round(raw.length / 1024) : 0,
        });

        if (draft?.invitationId && draft.invitationId !== previewId) remoteBase = await loadBaseFromSupabase(draft.invitationId);
        if (!remoteBase && draft?.slug && draft.slug !== previewId) remoteBase = await loadBaseFromSupabase(draft.slug);
        if (!remoteBase && draft?.data) renderInvitation(draft.data, "draft-envelope");
      }

      if (!remoteBase && !localInvitation && !renderedOnce) {
        console.warn("[Preview not found]", { draftId: previewId });
        setMissing(true);
        console.timeEnd("[PREVIEW_LOAD_DATA]");
        return;
      }

      if (remoteBase) {
        renderInvitation(remoteBase, "supabase-base");
        console.timeEnd("[PREVIEW_LOAD_DATA]");
        mergeRemoteImages(remoteBase)
          .then((mergedWithImages) => renderInvitation(mergedWithImages, "supabase-images"))
          .catch((error) => console.warn("[Preview image rows merge failed]", { error }));
      } else {
        console.timeEnd("[PREVIEW_LOAD_DATA]");
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [params.draftId]);

  if (missing) {
    return (
      <main className="min-h-dvh bg-[#f5f2ef] px-5 py-16 text-center text-[#2f2825]">
        <div className="mx-auto max-w-[430px] rounded-[18px] bg-white px-6 py-12 shadow-sm ring-1 ring-[#eaded5]">
          <h1 className="text-[20px] font-semibold">저장된 미리보기를 찾을 수 없습니다</h1>
          <p className="mt-3 text-[13px] leading-6 text-[#8a7a70]">
            저장된 데이터가 없거나 아직 공개되지 않은 주소입니다. 제작 화면에서 다시 저장해 주세요.
          </p>
          <Link href="/create" className="mt-7 inline-flex h-10 items-center rounded-full border border-[#d9c7bc] px-5 text-[13px] font-semibold">
            제작 화면으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="min-h-dvh bg-[#f5f2ef] px-5 py-16">
        <div className="mx-auto max-w-[430px] rounded-[18px] bg-white px-6 py-12 text-center text-[13px] text-[#8a7a70] shadow-sm ring-1 ring-[#eaded5]">
          청첩장을 불러오는 중입니다.
        </div>
      </main>
    );
  }

  const invitationId = invitation.id || params.draftId;
  const slug = invitation.slug || params.draftId;
  const editHref = `/create?editId=${encodeURIComponent(invitationId)}`;
  const publicHref = `/invitation/${encodeURIComponent(slug)}`;
  const purchaseUrl = storeUrl ? buildPurchaseUrl(storeUrl, invitationId, slug) : "";

  const handlePurchaseClick = async () => {
    if (!purchaseUrl) return;

    console.log("[Purchase click]", { invitationId, slug });
    setPurchaseStatus("구매 페이지로 이동합니다. 주문 메모에 청첩장 코드를 입력해 주세요.");

    try {
      await createPurchaseSessionAction({ invitationId, slug, naverProductUrl: storeUrl });
    } catch (error) {
      console.warn("[Purchase session create failed on client]", { error });
    } finally {
      console.log("[Purchase redirect]", { url: purchaseUrl });
      window.location.href = purchaseUrl;
    }
  };

  return (
    <main className="min-h-dvh bg-[#f5f2ef] px-0 py-0 sm:px-5 sm:py-8">
      <div className="sticky top-0 z-20 border-b border-[#eaded5] bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[430px] flex-col gap-3">
          <div className="flex gap-2">
            <Link href={editHref} className="flex h-10 flex-1 items-center justify-center rounded-[6px] border border-[#d9c7bc] bg-white text-[13px] font-semibold text-[#4d3b33]">
              수정하기
            </Link>
            <Link href={publicHref} className="flex h-10 flex-1 items-center justify-center rounded-[6px] border border-[#d9c7bc] bg-white text-[13px] font-semibold text-[#4d3b33]">
              공개 링크
            </Link>
            <button
              type="button"
              onClick={handlePurchaseClick}
              disabled={!purchaseUrl}
              className="flex h-10 flex-1 items-center justify-center rounded-[6px] bg-[#2f2825] px-3 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#c9beb8]"
            >
              구매하기
            </button>
          </div>
          <p className="text-center text-[11px] leading-5 text-[#8a7a70]">
            {purchaseUrl
              ? `구매 후 주문 메모에 청첩장 코드 ${slug}를 입력해 주세요.`
              : "NEXT_PUBLIC_NAVER_STORE_PRODUCT_URL을 설정하면 구매하기 버튼을 사용할 수 있습니다."}
          </p>
          {purchaseStatus && <p className="text-center text-[11px] leading-5 text-[#a06a4a]">{purchaseStatus}</p>}
        </div>
      </div>
      <div className="mx-auto max-w-[430px] bg-white shadow-[0_16px_40px_rgba(68,50,40,0.08)] sm:overflow-hidden sm:rounded-[24px]">
        <InvitationRenderer invitation={invitation} mode="public" />
      </div>
    </main>
  );
}
