"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import KoreanInvitationEditor from "@/components/KoreanInvitationEditor";
import KoreanInvitationPreview from "@/components/KoreanInvitationPreview";
import { getInvitationBySlugAction, saveInvitationAction, uploadInvitationFileAction } from "@/app/actions/invitationActions";
import { generateSlug } from "@/lib/generateSlug";
import type { PendingUpload, UploadResult } from "@/lib/upload";
import { emptyInvitationData, type InvitationData, type SavedInvitation } from "@/types/invitation";

const storageKey = "mobile-wedding-invitation";
const collectionKey = "mobile-wedding-invitations";
const menus = ["모바일청첩장", "식전영상", "감사영상", "추가영상", "프로포즈", "제작 내역", "이벤트"];

function createSavedInvitation(data: InvitationData): SavedInvitation {
  const now = new Date().toISOString();
  const slug = data.slug || generateSlug(data.groomName, data.brideName);
  return {
    ...data,
    id: data.id || (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : slug),
    slug,
    createdAt: now,
    updatedAt: now,
  };
}

function saveLocalInvitation(invitation: SavedInvitation) {
  window.localStorage.setItem(storageKey, JSON.stringify(invitation));
  const raw = window.localStorage.getItem(collectionKey);
  const list = raw ? (JSON.parse(raw) as SavedInvitation[]) : [];
  const next = [invitation, ...list.filter((item) => item.slug !== invitation.slug)];
  window.localStorage.setItem(collectionKey, JSON.stringify(next));
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingSlug = searchParams.get("slug");
  const [invitation, setInvitation] = useState<InvitationData>(emptyInvitationData);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      if (editingSlug) {
        const fromSupabase = await getInvitationBySlugAction(editingSlug);
        if (fromSupabase) {
          setInvitation({ ...emptyInvitationData, ...fromSupabase });
          return;
        }

        const raw = window.localStorage.getItem(collectionKey);
        const list = raw ? (JSON.parse(raw) as SavedInvitation[]) : [];
        const local = list.find((item) => item.slug === editingSlug);
        if (local) {
          setInvitation({ ...emptyInvitationData, ...local });
          return;
        }
      }

      const savedInvitation = window.localStorage.getItem(storageKey);
      if (!savedInvitation) return;

      try {
        setInvitation({ ...emptyInvitationData, ...JSON.parse(savedInvitation) });
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

  const resolvedPublicUrl = useMemo(() => {
    if (!publicUrl) return "";
    return publicUrl;
  }, [publicUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      let savedInvitation = createSavedInvitation(invitation);

      if (pendingUploads.length > 0) {
        setStatusMessage("파일 업로드 중입니다...");
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

        results.forEach((result: UploadResult, index) => {
          const fallbackPreviewUrl = pendingUploads[index]?.previewUrl ?? "";
          const publicUrl = result.publicUrl || fallbackPreviewUrl;
          if (result.type === "main") savedInvitation.coverImage = publicUrl;
          if (result.type === "intro") savedInvitation.introImage = publicUrl;
          if (result.type === "quote") savedInvitation.quoteImage = publicUrl;
          if (result.type === "kakao_thumbnail") savedInvitation.kakaoThumbnailUrl = publicUrl;
          if (result.type === "url_thumbnail") savedInvitation.urlThumbnailUrl = publicUrl;
          if (result.type === "audio") {
            savedInvitation.audioUrl = publicUrl;
            savedInvitation.musicUrl = publicUrl;
          }
          if (result.type === "gallery") {
            savedInvitation.galleryItems = savedInvitation.galleryItems.map((item) => (item.id === result.id ? { ...item, url: publicUrl } : item));
            savedInvitation.galleryImages = savedInvitation.galleryItems.map((item) => item.url);
          }
        });
      }

      savedInvitation.updatedAt = new Date().toISOString();
      setStatusMessage("저장 중입니다...");
      const result = await saveInvitationAction(savedInvitation);
      savedInvitation = result.invitation;
      saveLocalInvitation(savedInvitation);
      setInvitation(savedInvitation);
      setPendingUploads([]);
      const url = `${window.location.origin}/i/${savedInvitation.slug}`;
      setPublicUrl(url);
      setStatusMessage("저장되었습니다.");
      window.alert("저장되었습니다");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#111]">
      <header className="sticky top-0 z-40 border-b border-[#e5e5e5] bg-white">
        <div className="flex h-[42px] items-center justify-between px-4 lg:px-5">
          <Link href="/" className="shrink-0 text-[20px] font-black tracking-[0.08em] text-[#252525]">
            FROM TODAY
          </Link>
          <div className="hidden items-center gap-3 text-[12px] lg:flex">
            <span className="font-medium">daesung8846</span>
            <span className="h-3 w-px bg-[#ddd]" />
            <button type="button" className="text-[#777]">로그아웃</button>
          </div>
        </div>
        <div className="flex h-[41px] items-center justify-between border-t border-[#f3f3f3] px-4 lg:px-5">
          <nav className="flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap text-[15px] tracking-[-0.04em] text-[#111]">
            {menus.map((menu, index) => (
              <Link key={menu} href="/create" className="shrink-0">
                {menu}
                {index === 4 && <span className="ml-4 text-[#ddd]">|</span>}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="ml-4 hidden h-[33px] shrink-0 rounded-[4px] bg-[#f49a79] px-7 text-[14px] font-semibold text-white transition hover:bg-[#ee8765] disabled:opacity-60 sm:block"
          >
            {isSaving ? "저장중" : "저장하기"}
          </button>
        </div>
      </header>

      <div className="flex min-h-[52px] items-center justify-between border-b border-[#e8e8e8] bg-white px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-[14px] text-[#333]">
          <span className="text-[15px]">✉</span>
          <span className="whitespace-nowrap">모바일 청첩장</span>
          {statusMessage && <span className="ml-2 truncate text-[12px] text-[#777]">{statusMessage}</span>}
          {resolvedPublicUrl && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(resolvedPublicUrl)}
              className="ml-2 h-7 rounded border border-[#ddd] px-3 text-[12px]"
            >
              공개 URL 복사
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="h-[33px] rounded-[4px] bg-[#f49a79] px-7 text-[14px] font-semibold text-white transition hover:bg-[#ee8765] disabled:opacity-60 sm:hidden"
        >
          {isSaving ? "저장중" : "저장하기"}
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-[1260px] gap-5 px-4 py-6 md:grid-cols-[390px_minmax(0,1fr)] lg:gap-7 lg:px-7">
        <aside className="md:sticky md:top-[111px] md:h-[calc(100vh-126px)] md:overflow-y-auto">
          <KoreanInvitationPreview data={invitation} />
        </aside>

        <section className="min-w-0">
          <KoreanInvitationEditor data={invitation} isSaving={isSaving} onChange={handleChange} onPendingUpload={handlePendingUpload} />
        </section>
      </div>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f7f7]" />}>
      <CreatePageContent />
    </Suspense>
  );
}
