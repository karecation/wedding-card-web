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

  if (pendingUploads.length === 0) {
    return { invitation, failedCount: 0 };
  }

  const total = pendingUploads.length;
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
      // 업로드 실패 시 publicUrl 없음 — sanitize 단계에서 base64는 제거됨
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

  return { invitation: updatedInvitation, failedCount: failed };
}
