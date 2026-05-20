import { uploadInvitationFileAction } from "@/app/actions/invitationActions";
import type { PendingUpload } from "@/lib/upload";
import type { SavedInvitation } from "@/types/invitation";

export type UploadProgress = {
  total: number;
  completed: number;
  failed: number;
};

export type UploadInvitationImagesOptions = {
  onProgress?: (progress: UploadProgress) => void;
};

export async function uploadInvitationImages(
  invitation: SavedInvitation,
  pendingUploads: PendingUpload[],
  options: UploadInvitationImagesOptions = {},
): Promise<{ invitation: SavedInvitation; failedCount: number }> {
  const { onProgress } = options;

  // 갤러리: pendingUploads에 없는 File 객체를 미리 수집
  const handledGalleryIds = new Set(pendingUploads.filter((u) => u.type === "gallery").map((u) => u.id));
  const gallerySource = invitation.gallery?.images?.length ? invitation.gallery.images : invitation.galleryItems;
  const extraGalleryItems = (gallerySource ?? []).filter(
    (img) => img.file && !handledGalleryIds.has(img.id) && !img.url?.startsWith("https://"),
  );

  if (pendingUploads.length === 0 && extraGalleryItems.length === 0) {
    return { invitation, failedCount: 0 };
  }

  const total = pendingUploads.length + extraGalleryItems.length;
  let completed = 0;
  let failed = 0;

  onProgress?.({ total, completed, failed });

  const settledResults = await Promise.allSettled(
    pendingUploads.map(async (upload) => {
      const formData = new FormData();
      formData.append("file", upload.file);
      formData.append("id", upload.id);
      formData.append("type", upload.type);
      formData.append("invitationId", invitation.id); // UUID — slug(한글 가능)는 사용하지 않음
      const result = await uploadInvitationFileAction(formData);
      completed++;
      onProgress?.({ total, completed, failed });
      return result;
    }),
  );

  const updatedInvitation: SavedInvitation = { ...invitation };

  settledResults.forEach((result, index) => {
    const upload = pendingUploads[index];

    if (result.status === "rejected") {
      failed++;
      return;
    }

    const publicUrl = result.value.publicUrl;
    if (!publicUrl) return;

    if (upload.type === "main") {
      updatedInvitation.coverImage = publicUrl;
    } else if (upload.type === "intro") {
      updatedInvitation.introImage = publicUrl;
    } else if (upload.type === "quote") {
      updatedInvitation.quoteImage = publicUrl;
    } else if (upload.type === "kakao_thumbnail") {
      updatedInvitation.kakaoThumbnailUrl = publicUrl;
    } else if (upload.type === "url_thumbnail") {
      updatedInvitation.urlThumbnailUrl = publicUrl;
    } else if (upload.type === "audio") {
      updatedInvitation.audioUrl = publicUrl;
      updatedInvitation.musicUrl = publicUrl;
    } else if (upload.type === "gallery") {
      const galleryItems = updatedInvitation.galleryItems.map((item, order) =>
        item.id === upload.id
          ? { ...item, url: publicUrl, previewUrl: publicUrl, dataUrl: undefined, uploadStatus: "uploaded" as const, order }
          : { ...item, order },
      );
      updatedInvitation.galleryItems = galleryItems;
      updatedInvitation.galleryImages = galleryItems.map((item) => item.url || "").filter(Boolean);
      updatedInvitation.gallery = {
        ...(updatedInvitation.gallery ?? invitation.gallery),
        enabled: galleryItems.length > 0,
        images: galleryItems,
      };
    }
  });

  // 갤러리: pendingUploads에 없는 File 객체 업로드
  if (extraGalleryItems.length > 0) {
    const extraResults = await Promise.allSettled(
      extraGalleryItems.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file!);
        formData.append("id", img.id);
        formData.append("type", "gallery");
        formData.append("invitationId", invitation.id);
        const result = await uploadInvitationFileAction(formData);
        completed++;
        onProgress?.({ total, completed, failed });
        return { publicUrl: result.publicUrl, imageId: img.id };
      }),
    );

    const currentItems = [...(updatedInvitation.galleryItems ?? [])];
    extraResults.forEach((result) => {
      if (result.status === "rejected") { failed++; return; }
      const { publicUrl, imageId } = result.value;
      if (!publicUrl) return;
      const idx = currentItems.findIndex((item) => item.id === imageId);
      if (idx >= 0) {
        currentItems[idx] = { ...currentItems[idx], url: publicUrl, previewUrl: publicUrl, dataUrl: undefined, uploadStatus: "uploaded" as const };
      }
    });

    const finalItems = currentItems.map((item, order) => ({ ...item, order }));
    updatedInvitation.galleryItems = finalItems;
    updatedInvitation.galleryImages = finalItems.map((item) => item.url || "").filter(Boolean);
    updatedInvitation.gallery = {
      ...(updatedInvitation.gallery ?? invitation.gallery),
      enabled: finalItems.length > 0,
      images: finalItems,
    };
  }

  return { invitation: updatedInvitation, failedCount: failed };
}
