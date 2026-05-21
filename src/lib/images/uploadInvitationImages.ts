import { uploadInvitationFileAction } from "@/app/actions/invitationActions";
import type { PendingUpload } from "@/lib/upload";
import type { GalleryImage, SavedInvitation } from "@/types/invitation";

export type UploadProgress = {
  total: number;
  completed: number;
  failed: number;
};

export type UploadInvitationImagesOptions = {
  onProgress?: (progress: UploadProgress) => void;
};

type UploadInput = PendingUpload;

function countByType(uploads: UploadInput[]) {
  return uploads.reduce<Record<string, number>>((acc, upload) => {
    acc[upload.type] = (acc[upload.type] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeGalleryItems(invitation: SavedInvitation) {
  const source = invitation.gallery?.images?.length ? invitation.gallery.images : invitation.galleryItems;
  return (source ?? []).map((item, order) => ({ ...item, order }));
}

function cleanUploadedGalleryItems(items: GalleryImage[]) {
  return items.map((item, order) => ({
    ...item,
    file: undefined,
    dataUrl: undefined,
    previewUrl: item.url || item.previewUrl || "",
    order,
  }));
}

export async function uploadInvitationImages(
  invitation: SavedInvitation,
  pendingUploads: PendingUpload[],
  options: UploadInvitationImagesOptions = {},
): Promise<{ invitation: SavedInvitation; failedCount: number }> {
  const { onProgress } = options;
  const galleryItems = normalizeGalleryItems(invitation);
  const handledIds = new Set(pendingUploads.map((upload) => upload.id));
  const extraGalleryUploads: PendingUpload[] = galleryItems
    .filter((image) => image.file && !handledIds.has(image.id) && !image.url?.startsWith("http"))
    .map((image) => ({
      id: image.id,
      type: "gallery",
      file: image.file!,
      previewUrl: image.previewUrl,
      dataUrl: image.dataUrl,
    }));

  const uploads: UploadInput[] = [...pendingUploads, ...extraGalleryUploads];
  console.log("[Image assets collected]", { total: uploads.length, byType: countByType(uploads) });

  if (uploads.length === 0) {
    return { invitation, failedCount: 0 };
  }

  const total = uploads.length;
  let completed = 0;
  let failed = 0;
  onProgress?.({ total, completed, failed });

  const updatedInvitation: SavedInvitation = {
    ...invitation,
    galleryItems,
    gallery: {
      ...(invitation.gallery ?? { enabled: galleryItems.length > 0, title: invitation.galleryTitle, type: "grid", showArrows: false, images: [] }),
      images: galleryItems,
      enabled: invitation.gallery?.enabled ?? galleryItems.length > 0,
    },
  };

  const results = await Promise.allSettled(
    uploads.map(async (upload) => {
      console.log("[Storage upload start]", {
        type: upload.type,
        id: upload.id,
        fileType: upload.file.type,
        fileSize: upload.file.size,
      });

      const formData = new FormData();
      formData.append("file", upload.file);
      formData.append("id", upload.id);
      formData.append("type", upload.type);
      formData.append("invitationId", invitation.id);

      const result = await uploadInvitationFileAction(formData);
      console.log("[Storage upload success]", { type: upload.type, publicUrl: result.publicUrl });
      return result;
    }),
  );

  results.forEach((result, index) => {
    const upload = uploads[index];
    completed++;

    if (result.status === "rejected") {
      failed++;
      console.warn("[Storage upload failed]", {
        type: upload.type,
        id: upload.id,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      onProgress?.({ total, completed, failed });
      return;
    }

    const publicUrl = result.value.publicUrl;
    if (!publicUrl) {
      failed++;
      console.warn("[Storage upload failed]", { type: upload.type, id: upload.id, error: "missing publicUrl" });
      onProgress?.({ total, completed, failed });
      return;
    }

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
      const nextItems = normalizeGalleryItems(updatedInvitation).map((item) =>
        item.id === upload.id
          ? {
              ...item,
              file: undefined,
              url: publicUrl,
              previewUrl: publicUrl,
              dataUrl: undefined,
              uploadStatus: "uploaded" as const,
            }
          : item,
      );
      updatedInvitation.galleryItems = cleanUploadedGalleryItems(nextItems);
      updatedInvitation.galleryImages = updatedInvitation.galleryItems.map((item) => item.url || "").filter(Boolean);
      updatedInvitation.gallery = {
        ...(updatedInvitation.gallery ?? invitation.gallery),
        enabled: updatedInvitation.galleryItems.length > 0,
        images: updatedInvitation.galleryItems,
      };
    }

    onProgress?.({ total, completed, failed });
  });

  updatedInvitation.galleryItems = cleanUploadedGalleryItems(normalizeGalleryItems(updatedInvitation));
  updatedInvitation.galleryImages = updatedInvitation.galleryItems.map((item) => item.url || "").filter(Boolean);
  updatedInvitation.gallery = {
    ...(updatedInvitation.gallery ?? invitation.gallery),
    enabled: updatedInvitation.galleryItems.length > 0,
    images: updatedInvitation.galleryItems,
  };

  console.log("[uploadInvitationImages] complete", {
    invitationId: updatedInvitation.id,
    imageCount: updatedInvitation.galleryItems.length,
    failedCount: failed,
  });

  return { invitation: updatedInvitation, failedCount: failed };
}
