"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getInvitationByIdAction, getInvitationBySlugAction, saveInvitationAction } from "@/app/actions/invitationActions";
import KoreanInvitationEditor from "@/components/KoreanInvitationEditor";
import KoreanInvitationPreview from "@/components/KoreanInvitationPreview";
import PreviewErrorBoundary from "@/components/invitation/PreviewErrorBoundary";
import { generateSlug } from "@/lib/generateSlug";
import { uploadInvitationImages } from "@/lib/images/uploadInvitationImages";
import { sanitizeInvitationForStorage } from "@/lib/invitation/sanitizeInvitationForStorage";
import { canCreateLocalInvitation, getWeddingSessionId, LOCAL_INVITATIONS_STORAGE_KEY, readLocalInvitation, saveLocalInvitationRecord } from "@/lib/localInvitations";
import type { PendingUpload } from "@/lib/upload";
import { emptyInvitationData, type InvitationData, type SavedInvitation } from "@/types/invitation";

const storageKey = "mobile-wedding-invitation";
const collectionKey = LOCAL_INVITATIONS_STORAGE_KEY;

function hasAccountData(data: InvitationData) {
  return data.bankAccounts.some((account) => account.bankName || account.accountNumber || account.accountHolder);
}

function hasOptionalContent(data: InvitationData, id: string) {
  if (id === "gallery") return data.galleryItems.length > 0;
  if (id === "video") return Boolean(data.youtubeVideoId || data.youtubeUrl);
  if (id === "notice") return Boolean(data.noticeGroupBody || data.noticeSeparateBody);
  if (id === "accounts") return hasAccountData(data);
  if (id === "guestbook") return false;
  if (id === "quote") return Boolean(data.quoteImage || data.quoteText);
  return true;
}

function nonEmpty(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value : "";
}

function normalizeLocationFields(data: InvitationData): InvitationData {
  const firstTransport = data.transports[0];
  const location = {
    venueName: nonEmpty(data.location?.venueName) || data.venueName,
    hallName: nonEmpty(data.location?.hallName) || data.venueHall,
    address: nonEmpty(data.location?.address) || data.venueAddress,
    detailAddress: data.location?.detailAddress || "",
    lat: data.location?.lat ?? data.latitude ?? undefined,
    lng: data.location?.lng ?? data.longitude ?? undefined,
    transportTitle: nonEmpty(data.location?.transportTitle) || firstTransport?.title || "",
    transportDescription: nonEmpty(data.location?.transportDescription) || firstTransport?.description || "",
  };

  return {
    ...data,
    venueName: location.venueName,
    venueHall: location.hallName,
    venueAddress: location.address,
    latitude: location.lat ?? null,
    longitude: location.lng ?? null,
    location,
  };
}

function prepareInitialInvitation(data: InvitationData, isEdit = false): InvitationData {
  const nextData = normalizeLocationFields(data);
  return {
    ...nextData,
    gallery: nextData.gallery ?? emptyInvitationData.gallery,
    menuOrder: nextData.menuOrder.map((item) => ({
      ...item,
      // 신규 생성 시에만 콘텐츠 유무로 enabled 필터링.
      // 수정 시에는 저장된 enabled 값 그대로 유지 (계좌/공지 등 비어있어도 켜둔 경우 보존).
      enabled: isEdit ? item.enabled : (item.enabled && hasOptionalContent(nextData, item.id)),
    })),
  };
}

function createId(prefix = "draft") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSavedInvitation(data: InvitationData): SavedInvitation {
  const now = new Date().toISOString();
  const slug = data.slug || generateSlug(data.groomName, data.brideName);
  const previous = data as Partial<SavedInvitation>;
  return {
    ...data,
    id: data.id || createId(slug),
    slug,
    createdAt: previous.createdAt || now,
    updatedAt: now,
  };
}

function sanitizeInvitationForLocalStorage(invitation: SavedInvitation): SavedInvitation {
  return sanitizeInvitationForStorage(invitation);
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.message.toLowerCase().includes("quota")
  );
}

function getApproxStorageSizeKb(value: unknown): number {
  try {
    return Math.round(JSON.stringify(value).length / 1024);
  } catch {
    return -1;
  }
}

function safeLocalStorageSet(key: string, value: unknown): boolean {
  try {
    console.log("[LocalStorage save start]", { key, approximateSizeKb: getApproxStorageSizeKb(value) });
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("[LocalStorage quota exceeded]", { key, approximateSizeKb: getApproxStorageSizeKb(value) });
      cleanupOldInvitationDrafts({ maxDrafts: 1 });
      try {
        if (key !== collectionKey) window.localStorage.removeItem(collectionKey);
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        console.warn("[LocalStorage backup skipped]", { key });
        return false;
      }
    }
    console.warn("[LocalStorage save failed]", { key, error });
    return false;
  }
}

function stripHeavyImageFields(data: InvitationData): InvitationData {
  try {
    const cleanUrl = (url?: string) => (url && (url.startsWith("http://") || url.startsWith("https://")) ? url : "");
    const cleanGalleryItem = (img: import("@/types/invitation").GalleryImage, index: number) => {
      const url = cleanUrl(img.url || img.previewUrl || img.dataUrl || "");
      return {
        id: img.id || `gallery-${index}`,
        url,
        previewUrl: url,
        dataUrl: undefined,
        caption: img.caption ?? "",
        order: index,
        uploadStatus: url ? ("uploaded" as const) : img.uploadStatus,
        type: "gallery" as const,
      };
    };
    const gallerySource = data.gallery?.images?.length ? data.gallery.images : data.galleryItems;
    const galleryItems = (gallerySource ?? []).map(cleanGalleryItem).filter((img) => img.url);
    return {
      ...data,
      coverImage: cleanUrl(data.coverImage),
      introImage: cleanUrl(data.introImage),
      quoteImage: cleanUrl(data.quoteImage),
      kakaoThumbnailUrl: cleanUrl(data.kakaoThumbnailUrl),
      urlThumbnailUrl: cleanUrl(data.urlThumbnailUrl),
      galleryItems,
      galleryImages: galleryItems.map((img) => img.url).filter(Boolean),
      gallery: data.gallery
        ? { ...data.gallery, images: galleryItems, enabled: data.gallery.enabled || galleryItems.length > 0 }
        : data.gallery,
    };
  } catch (error) {
    console.error("[stripHeavyImageFields] 처리 실패 — 원본 메타만 저장", error);
    // 최후 fallback: 갤러리/이미지 전부 비운 안전한 객체 반환
    return {
      ...data,
      coverImage: "",
      introImage: "",
      quoteImage: "",
      kakaoThumbnailUrl: "",
      urlThumbnailUrl: "",
      galleryItems: [],
      galleryImages: [],
      gallery: data.gallery ? { ...data.gallery, images: [], enabled: false } : data.gallery,
    };
  }
}

function cleanupOldInvitationDrafts({ maxDrafts = 3 }: { maxDrafts?: number } = {}) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("invitation-draft-")) keys.push(key);
    }
    if (keys.length <= maxDrafts) return;
    const removedKeys = keys.slice(0, keys.length - maxDrafts);
    removedKeys.forEach((key) => window.localStorage.removeItem(key));
    console.log("[Local draft cleanup]", { removedKeys });
  } catch {
    // localStorage 접근 불가 시 무시
  }
}

function cleanupLocalDrafts({ reason, keepDraftId }: { reason: string; keepDraftId?: string }) {
  try {
    const removedKeys: string[] = [];
    const keepKey = keepDraftId ? `invitation-draft-${keepDraftId}` : "";

    if (window.localStorage.getItem(storageKey)) {
      window.localStorage.removeItem(storageKey);
      removedKeys.push(storageKey);
    }

    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith("invitation-draft-") || key === keepKey) continue;
      window.localStorage.removeItem(key);
      removedKeys.push(key);
    }

    console.log("[Local draft cleanup]", { reason, removedKeys });
  } catch (error) {
    console.warn("[Local draft cleanup failed]", { reason, error });
  }
}

function revokeObjectUrls(invitation: InvitationData, uploads: PendingUpload[]) {
  const urls = new Set<string>();
  uploads.forEach((upload) => {
    if (upload.previewUrl?.startsWith("blob:")) urls.add(upload.previewUrl);
  });
  const gallerySource = invitation.gallery?.images?.length ? invitation.gallery.images : invitation.galleryItems;
  gallerySource?.forEach((image) => {
    if (image.previewUrl?.startsWith("blob:")) urls.add(image.previewUrl);
  });
  [invitation.coverImage, invitation.introImage, invitation.quoteImage, invitation.kakaoThumbnailUrl, invitation.urlThumbnailUrl, invitation.audioUrl]
    .filter((url): url is string => Boolean(url?.startsWith("blob:")))
    .forEach((url) => urls.add(url));

  urls.forEach((url) => URL.revokeObjectURL(url));
  if (urls.size > 0) console.log("[Create reset]", { reason: "object-url-revoked", count: urls.size });
}

function saveLocalInvitation(invitation: SavedInvitation) {
  return saveLocalInvitationRecord(invitation);
}

// Draft envelope: preview 페이지에서 Supabase 재조회를 위해 slug/invitationId를 함께 저장
type DraftEnvelope = {
  draftId: string;
  slug: string;
  invitationId: string;
  savedAt: string;
  data: SavedInvitation | null;
};

function parseDraft(raw: string): DraftEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "data" in parsed) return parsed as DraftEnvelope;
    return null;
  } catch (error) {
    console.warn("[Create draft parse failed]", { error });
    return null;
  }
}

async function loadInvitationByIdentifier(identifier: string): Promise<SavedInvitation | null> {
  const byId = await getInvitationByIdAction(identifier);
  if (byId) return byId;

  const bySlug = await getInvitationBySlugAction(identifier);
  if (bySlug) return bySlug;

  return readLocalInvitation(identifier);
}

async function loadDraftInvitation(draftId: string): Promise<SavedInvitation | null> {
  const fromDb = await loadInvitationByIdentifier(draftId);
  if (fromDb) return fromDb;

  const raw = window.localStorage.getItem(`invitation-draft-${draftId}`);
  const draft = raw ? parseDraft(raw) : null;
  if (!draft) return null;

  if (draft.invitationId) {
    const byId = await loadInvitationByIdentifier(draft.invitationId);
    if (byId) return byId;
  }

  if (draft.slug) {
    const bySlug = await loadInvitationByIdentifier(draft.slug);
    if (bySlug) return bySlug;
  }

  return draft.data ?? null;
}

function saveDraft(invitation: SavedInvitation, previewId = invitation.id || invitation.slug || createId("preview")): string {
  const draftId = previewId;

  cleanupOldInvitationDrafts({ maxDrafts: 3 });

  const lightweightInvitation = sanitizeInvitationForLocalStorage(invitation);
  const envelope: DraftEnvelope = {
    draftId,
    slug: lightweightInvitation.slug,
    invitationId: lightweightInvitation.id,
    savedAt: new Date().toISOString(),
    data: lightweightInvitation,
  };

  const ok = safeLocalStorageSet(`invitation-draft-${draftId}`, envelope);
  if (!ok) {
    // 용량 초과 시 이미지 필드 비우고 텍스트 + slug/id만 저장 — preview에서 Supabase로 fetch 가능
    const textOnlyData: SavedInvitation = {
      ...lightweightInvitation,
      coverImage: "",
      introImage: "",
      quoteImage: "",
      kakaoThumbnailUrl: "",
      urlThumbnailUrl: "",
      galleryItems: [],
      galleryImages: [],
      gallery: { ...lightweightInvitation.gallery, images: [], enabled: false },
    };
    const textOnlyEnvelope: DraftEnvelope = { ...envelope, data: textOnlyData };
    const ok2 = safeLocalStorageSet(`invitation-draft-${draftId}`, textOnlyEnvelope);
    if (!ok2) {
      // 최후 fallback: slug/invitationId만 — preview가 Supabase로 전체 조회
      try {
        window.localStorage.setItem(
          `invitation-draft-${draftId}`,
          JSON.stringify({
            draftId,
            slug: envelope.slug,
            invitationId: envelope.invitationId,
            savedAt: envelope.savedAt,
            data: null,
          }),
        );
      } catch {
        console.warn("[saveDraft] localStorage 용량 초과 — slug/id만 저장 시도도 실패");
      }
    }
  }

  console.log("[Draft envelope saved]", {
    draftId,
    slug: envelope.slug,
    invitationId: envelope.invitationId,
    hasGallery: (envelope.data?.galleryItems.length ?? 0) > 0,
  });

  return draftId;
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const editId = searchParams.get("editId") || searchParams.get("edit") || searchParams.get("slug");
  const [invitation, setInvitation] = useState<InvitationData>(() => prepareInitialInvitation(emptyInvitationData));
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      if (draftId) {
        console.log("[Create init]", { mode: "draft", draftId });
        const draft = await loadDraftInvitation(draftId);
        setInvitation(prepareInitialInvitation({ ...emptyInvitationData, ...(draft ?? {}) }, true));
        return;
      }

      if (editId) {
        console.log("[Create init]", { mode: "edit", editId });
        const loaded = await loadInvitationByIdentifier(editId);
        setInvitation(prepareInitialInvitation({ ...emptyInvitationData, ...(loaded ?? {}) }, true));
        return;
      }

      console.log("[Create init]", { mode: "new" });
      console.log("[Create reset]", { reason: "new-create" });
      cleanupLocalDrafts({ reason: "new-create" });
      setInvitation(prepareInitialInvitation(emptyInvitationData));
    };

    loadInvitation();
  }, [draftId, editId]);

  const handleChange = (nextInvitation: InvitationData) => {
    setInvitation(nextInvitation);
  };

  const handlePendingUpload = (upload: PendingUpload) => {
    console.log("[Pending upload queued]", {
      id: upload.id,
      type: upload.type,
      fileType: upload.file.type,
      fileSize: upload.file.size,
      hasPreviewUrl: Boolean(upload.previewUrl),
      hasDataUrl: Boolean(upload.dataUrl),
    });
    setPendingUploads((current) => [...current.filter((item) => item.id !== upload.id), upload]);
  };

  const handleSave = async () => {
    if (isSaving) return;
    console.time("[SAVE_INVITATION]");
    setIsSaving(true);
    setStatusMessage("저장 중입니다...");

    let savedInvitation: SavedInvitation = {
      ...createSavedInvitation(normalizeLocationFields(invitation)),
      sessionId: getWeddingSessionId(),
    } as SavedInvitation;
    const isEditingExisting = Boolean(invitation.id || readLocalInvitation(savedInvitation.id) || readLocalInvitation(savedInvitation.slug));

    if (!isEditingExisting && !canCreateLocalInvitation()) {
      setStatusMessage("한 세션에서는 최대 3개까지만 저장할 수 있습니다. 기존 청첩장을 삭제한 후 다시 저장해주세요.");
      console.timeEnd("[SAVE_INVITATION]");
      setIsSaving(false);
      return;
    }

    const hasSupabaseEnv = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    );

    console.log("[Save start]", {
      slug: savedInvitation.slug,
      id: savedInvitation.id,
      pendingUploads: pendingUploads.length,
      pendingByType: pendingUploads.reduce<Record<string, number>>((acc, u) => {
        acc[u.type] = (acc[u.type] ?? 0) + 1;
        return acc;
      }, {}),
      galleryItemsInState: invitation.galleryItems.length,
      galleryWithFile: invitation.galleryItems.filter((i) => i.file).length,
    });
    console.log("[Supabase env]", {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    });

    if (!hasSupabaseEnv) {
      console.warn(
        "[Save] Supabase 환경변수 미설정 — base64 fallback 모드로 저장됩니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY 를 설정하세요.",
      );
    }

    console.log("[Before save gallery payload]", {
      galleryEnabled: invitation.gallery?.enabled,
      galleryImagesCount: invitation.gallery?.images?.length ?? 0,
      galleryItemsCount: invitation.galleryItems?.length ?? 0,
      withFileInImages: (invitation.gallery?.images ?? []).filter((i) => i.file).length,
      withFileInItems: (invitation.galleryItems ?? []).filter((i) => i.file).length,
      pendingGalleryCount: pendingUploads.filter((u) => u.type === "gallery").length,
      galleryImagesSample: (invitation.gallery?.images ?? []).slice(0, 3).map((img) => ({
        id: img.id,
        hasFile: Boolean(img.file),
        urlPrefix: (img.url || "").slice(0, 50),
        previewUrlPrefix: (img.previewUrl || "").slice(0, 50),
      })),
    });

    console.log("[Before save image payload]", {
      pendingUploadsCount: pendingUploads.length,
      pendingUploadsTypes: pendingUploads.map((item) => item.type),
      galleryImagesCount: invitation.gallery?.images?.length ?? 0,
      galleryItemsCount: invitation.galleryItems?.length ?? 0,
      galleryWithFile: [
        ...(invitation.gallery?.images ?? []),
        ...(invitation.galleryItems ?? []),
      ].filter((img, index, source) => img.file && source.findIndex((item) => item.id === img.id) === index).length,
      quoteHasImage: Boolean(invitation.quoteImage),
      kakaoThumbnail: invitation.kakaoThumbnailUrl,
      urlThumbnail: invitation.urlThumbnailUrl,
    });

    try {
      if (pendingUploads.length > 0 || invitation.galleryItems.some((i) => i.file)) {
        setStatusMessage(`이미지 업로드 중 (0 / ${pendingUploads.length})`);

        const { invitation: uploaded, failedCount } = await uploadInvitationImages(
          savedInvitation,
          pendingUploads,
          {
            onProgress: ({ completed, total }) => {
              setStatusMessage(`이미지 업로드 중 (${completed} / ${total})`);
            },
          },
        );

        savedInvitation = uploaded;

        if (failedCount > 0) {
          setStatusMessage(`이미지 ${failedCount}개 업로드 실패 — 나머지는 저장됩니다.`);
        }
      }

      setStatusMessage("청첩장 저장 중...");
      savedInvitation.updatedAt = new Date().toISOString();
      savedInvitation = sanitizeInvitationForLocalStorage(savedInvitation);

      console.log("[Final data image check]", {
        hasMainImage: Boolean(savedInvitation.coverImage || savedInvitation.introImage),
        galleryCount: savedInvitation.galleryItems.filter((img) => img.url).length,
        hasPhotoQuote: Boolean(savedInvitation.quoteImage),
        hasShareThumbnail: Boolean(savedInvitation.kakaoThumbnailUrl || savedInvitation.urlThumbnailUrl),
      });
      console.log("[Image save check]", {
        introMainImageUrl: savedInvitation.coverImage || savedInvitation.introImage,
        introMainImagePreviewUrl: savedInvitation.coverImage || savedInvitation.introImage,
        galleryCount: savedInvitation.gallery?.images?.length || savedInvitation.galleryItems.length,
        firstGalleryUrl: savedInvitation.gallery?.images?.[0]?.url || savedInvitation.galleryItems[0]?.url,
      });

      console.log("[Sanitized invitation payload]", {
        id: savedInvitation.id,
        slug: savedInvitation.slug,
        coverImage: savedInvitation.coverImage ? savedInvitation.coverImage.slice(0, 60) + "..." : "(없음)",
        introImage: savedInvitation.introImage ? savedInvitation.introImage.slice(0, 60) + "..." : "(없음)",
        quoteImage: savedInvitation.quoteImage ? savedInvitation.quoteImage.slice(0, 60) + "..." : "(없음)",
        kakaoThumbnailUrl: savedInvitation.kakaoThumbnailUrl ? savedInvitation.kakaoThumbnailUrl.slice(0, 60) + "..." : "(없음)",
        urlThumbnailUrl: savedInvitation.urlThumbnailUrl ? savedInvitation.urlThumbnailUrl.slice(0, 60) + "..." : "(없음)",
        galleryItemsCount: savedInvitation.galleryItems.length,
        gallerySources: savedInvitation.galleryItems.map((img) => ({
          id: img.id,
          urlType: img.url?.startsWith("https://") ? "https" : img.url ? "url" : "empty",
          urlPrefix: img.url?.slice(0, 50),
        })),
      });

      console.log("[DB save start]", { slug: savedInvitation.slug });
      try {
        const result = await saveInvitationAction(savedInvitation);
        savedInvitation = result.invitation;
        console.log("[DB save success]", { slug: savedInvitation.slug, id: savedInvitation.id, source: result.source });
        if ("ok" in result && !result.ok) {
          setStatusMessage("임시 저장되었습니다. 배포 공유용으로는 DB 연결이 필요합니다.");
          console.warn("[DB save fallback]", { error: result.error });
        }
      } catch (dbError) {
        console.warn("[DB save failed]", { error: dbError instanceof Error ? dbError.message : dbError });
        setStatusMessage("DB 저장 실패 — 로컬 미리보기로 저장합니다.");
      }

      setStatusMessage("미리보기 생성 중...");
      const localSaved = saveLocalInvitation(savedInvitation);
      if (!localSaved) {
        setStatusMessage("한 세션에서는 최대 3개까지만 저장할 수 있습니다. 기존 청첩장을 삭제한 후 다시 저장해주세요.");
        return;
      }
      setInvitation(savedInvitation);
      setPendingUploads([]);

      const previewId = savedInvitation.id || savedInvitation.slug;
      const previewUrl = `/preview/${previewId}`;
      const draftId = saveDraft(savedInvitation, previewId);
      revokeObjectUrls(invitation, pendingUploads);
      cleanupLocalDrafts({ reason: "after-save", keepDraftId: draftId });
      console.log("[SAVE_INVITATION] saved:", savedInvitation);
      console.log("[SAVE_INVITATION] navigating to preview:", previewUrl);
      console.log("[Invitation saved]", { id: savedInvitation.id, slug: savedInvitation.slug });
      console.log("[Saved invitation data images]", {
        hasMainImageUrl: Boolean(savedInvitation.coverImage || savedInvitation.introImage),
        galleryImageCount: savedInvitation.galleryItems.filter((img) => img.url).length,
        hasPhotoQuoteUrl: Boolean(savedInvitation.quoteImage),
        hasShareUrl: Boolean(savedInvitation.kakaoThumbnailUrl || savedInvitation.urlThumbnailUrl),
      });
      console.log("[Draft saved for preview]", {
        draftId,
        slug: savedInvitation.slug,
        imageCount: savedInvitation.galleryItems.length,
        imagesHavingUrl: savedInvitation.galleryItems.filter((img) => img.url).length,
      });
      console.log("[Preview route push]", { previewId });
      setStatusMessage("저장되었습니다. 미리보기로 이동합니다.");
      router.push(previewUrl);
    } catch (error) {
      console.error("[Save failed]", error);
      setStatusMessage("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      console.timeEnd("[SAVE_INVITATION]");
      setIsSaving(false);
    }
  };

  return (
    <main
      className="create-page text-[#2b211c]"
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files?.length) event.preventDefault();
      }}
    >
      <header className="create-header">
        <div className="mx-auto flex h-full w-full max-w-[1080px] items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#8e7464]">INVITATION BUILDER</p>
            <p className="truncate text-[13px] text-[#5d524b]">모바일 청첩장 제작</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 rounded-[7px] bg-[#B8896A] px-7 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(184,137,106,0.20)] transition hover:-translate-y-0.5 hover:bg-[#8E7464] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "저장 중" : "저장하기"}
          </button>
        </div>
      </header>

      <div className="create-toolbar">
        <div className="mx-auto flex h-full w-full max-w-[1080px] items-center px-4">
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-[#555]">
            <span className="text-[#999]">✉</span>
            <span className="whitespace-nowrap">모바일 청첩장</span>
            {statusMessage && <span className="truncate text-[12px] text-[#999]">· {statusMessage}</span>}
          </div>
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <div className="border-y border-[#f4dccd] bg-[#fff7f0] px-4 py-2 text-center text-[12px] leading-5 text-[#a06a4a]">
          ⚠ Supabase가 설정되지 않아 base64 fallback 모드로 동작합니다. 영구 저장을 원하시면 <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>에 <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code className="rounded bg-white px-1.5 py-0.5">SUPABASE_SECRET_KEY</code>를 추가하세요.
        </div>
      )}

      <div className="create-main mx-auto w-full max-w-[1080px] px-4 py-4">
        <aside className="preview-panel">
          <PreviewErrorBoundary label="create-preview">
            <KoreanInvitationPreview data={invitation} />
          </PreviewErrorBoundary>
        </aside>

        <section className="editor-panel">
          <div className="mx-auto max-w-[660px]">
            <KoreanInvitationEditor data={invitation} isSaving={isSaving} onChange={handleChange} onPendingUpload={handlePendingUpload} />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<main className="create-page" />}>
      <CreatePageContent />
    </Suspense>
  );
}
