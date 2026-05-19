"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getInvitationBySlugAction, saveInvitationAction, uploadInvitationFileAction } from "@/app/actions/invitationActions";
import KoreanInvitationEditor from "@/components/KoreanInvitationEditor";
import KoreanInvitationPreview from "@/components/KoreanInvitationPreview";
import { generateSlug } from "@/lib/generateSlug";
import type { PendingUpload, UploadResult } from "@/lib/upload";
import { emptyInvitationData, type InvitationData, type SavedInvitation } from "@/types/invitation";

const storageKey = "mobile-wedding-invitation";
const collectionKey = "mobile-wedding-invitations";

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

function prepareInitialInvitation(data: InvitationData): InvitationData {
  return {
    ...data,
    gallery: data.gallery ?? emptyInvitationData.gallery,
    menuOrder: data.menuOrder.map((item) => ({
      ...item,
      enabled: item.enabled && hasOptionalContent(data, item.id),
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

function saveLocalInvitation(invitation: SavedInvitation) {
  const localInvitation = sanitizeInvitationForLocalStorage(invitation);
  window.localStorage.setItem(storageKey, JSON.stringify(localInvitation));
  const raw = window.localStorage.getItem(collectionKey);
  const list = raw ? (JSON.parse(raw) as SavedInvitation[]) : [];
  const next = [localInvitation, ...list.filter((item) => item.slug !== invitation.slug)];
  window.localStorage.setItem(collectionKey, JSON.stringify(next));
}

function saveDraft(invitation: SavedInvitation) {
  const draftId = createId("preview");
  window.localStorage.setItem(`invitation-draft-${draftId}`, JSON.stringify(sanitizeInvitationForLocalStorage(invitation)));
  return draftId;
}

function sanitizeInvitationForLocalStorage(invitation: SavedInvitation): SavedInvitation {
  const galleryImages = (invitation.gallery?.images ?? invitation.galleryItems ?? []).map(({ file: _file, ...image }, index) => ({
    ...image,
    previewUrl: image.previewUrl || image.url || "",
    url: image.url || image.previewUrl || "",
    order: index,
  }));

  return {
    ...invitation,
    gallery: {
      ...(invitation.gallery ?? emptyInvitationData.gallery),
      images: galleryImages,
      enabled: invitation.gallery?.enabled ?? galleryImages.length > 0,
    },
    galleryItems: galleryImages,
    galleryImages: galleryImages.map((image) => image.previewUrl || image.url || "").filter(Boolean),
  };
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingSlug = searchParams.get("slug");
  const [invitation, setInvitation] = useState<InvitationData>(() => prepareInitialInvitation(emptyInvitationData));
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      if (editingSlug) {
        const fromSupabase = await getInvitationBySlugAction(editingSlug);
        if (fromSupabase) {
          setInvitation(prepareInitialInvitation({ ...emptyInvitationData, ...fromSupabase }));
          return;
        }

        const raw = window.localStorage.getItem(collectionKey);
        const list = raw ? (JSON.parse(raw) as SavedInvitation[]) : [];
        const local = list.find((item) => item.slug === editingSlug);
        if (local) {
          setInvitation(prepareInitialInvitation({ ...emptyInvitationData, ...local }));
          return;
        }
      }

      const savedInvitation = window.localStorage.getItem(storageKey);
      if (!savedInvitation) return;
      try {
        setInvitation(prepareInitialInvitation({ ...emptyInvitationData, ...JSON.parse(savedInvitation) }));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    };

    loadInvitation();
  }, [editingSlug]);

  const handleChange = (nextInvitation: InvitationData) => {
    setInvitation(nextInvitation);
    window.localStorage.setItem(storageKey, JSON.stringify(nextInvitation));
  };

  const handlePendingUpload = (upload: PendingUpload) => {
    setPendingUploads((current) => [...current.filter((item) => item.id !== upload.id), upload]);
  };

  const applyUploadResults = (savedInvitation: SavedInvitation, results: UploadResult[]) => {
    results.forEach((result: UploadResult, index) => {
      const fallbackPreviewUrl = pendingUploads[index]?.previewUrl ?? "";
      const uploadedUrl = result.publicUrl || fallbackPreviewUrl;
      if (result.type === "main") savedInvitation.coverImage = uploadedUrl;
      if (result.type === "intro") savedInvitation.introImage = uploadedUrl;
      if (result.type === "quote") savedInvitation.quoteImage = uploadedUrl;
      if (result.type === "kakao_thumbnail") savedInvitation.kakaoThumbnailUrl = uploadedUrl;
      if (result.type === "url_thumbnail") savedInvitation.urlThumbnailUrl = uploadedUrl;
      if (result.type === "audio") {
        savedInvitation.audioUrl = uploadedUrl;
        savedInvitation.musicUrl = uploadedUrl;
      }
      if (result.type === "gallery") {
        const nextGalleryItems = savedInvitation.galleryItems.map((item, order) => (item.id === result.id ? { ...item, url: uploadedUrl, previewUrl: uploadedUrl, order } : { ...item, order }));
        savedInvitation.galleryItems = nextGalleryItems;
        savedInvitation.galleryImages = nextGalleryItems.map((item) => item.url || item.previewUrl || "").filter(Boolean);
        savedInvitation.gallery = {
          ...(savedInvitation.gallery ?? emptyInvitationData.gallery),
          enabled: nextGalleryItems.length > 0,
          images: nextGalleryItems,
        };
      }
    });
  };

  const moveToDraftPreview = (savedInvitation: SavedInvitation) => {
    saveLocalInvitation(savedInvitation);
    setInvitation(savedInvitation);
    setPendingUploads([]);
    const draftId = saveDraft(savedInvitation);
    setStatusMessage("저장되었습니다. 미리보기로 이동합니다.");
    router.push(`/preview/${draftId}`);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setStatusMessage("저장 중입니다...");

    let savedInvitation = createSavedInvitation(invitation);

    try {
      if (pendingUploads.length > 0) {
        setStatusMessage("업로드 중입니다...");
        const results = await Promise.all(
          pendingUploads.map((upload) => {
            const formData = new FormData();
            formData.append("file", upload.file);
            formData.append("id", upload.id);
            formData.append("type", upload.type);
            formData.append("slug", savedInvitation.slug);
            return uploadInvitationFileAction(formData);
          }),
        );
        applyUploadResults(savedInvitation, results);
      }

      savedInvitation.updatedAt = new Date().toISOString();
      savedInvitation = sanitizeInvitationForLocalStorage(savedInvitation);

      try {
        const result = await saveInvitationAction(savedInvitation);
        savedInvitation = result.invitation;
      } catch {
        setStatusMessage("DB 저장 대신 로컬 미리보기로 저장합니다.");
      }

      moveToDraftPreview(savedInvitation);
    } catch (error) {
      console.error(error);
      setStatusMessage("업로드 저장에 실패해 로컬 미리보기로 저장합니다.");
      moveToDraftPreview(savedInvitation);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="create-page bg-[#fafafa] text-[#111]">
      <header className="create-header">
        <div className="mx-auto flex h-full w-full max-w-[1080px] items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-7">
            <Link href="/" className="shrink-0 text-[15px] font-bold tracking-[0.18em] text-[#222]">
              SAVE THE DATE
            </Link>
            <Link href="/create" className="whitespace-nowrap text-[13px] font-medium text-[#333]">
              모바일 청첩장
            </Link>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 rounded-[4px] bg-[#f49a79] px-6 text-[13px] font-semibold text-white transition hover:bg-[#ee8765] disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="create-main mx-auto w-full max-w-[1080px] px-4 py-4">
        <aside className="preview-panel">
          <KoreanInvitationPreview data={invitation} />
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
    <Suspense fallback={<main className="create-page bg-[#fafafa]" />}>
      <CreatePageContent />
    </Suspense>
  );
}
