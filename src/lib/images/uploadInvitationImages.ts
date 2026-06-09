import { uploadInvitationFileAction } from "@/app/actions/invitationActions";
import { normalizeUploadType } from "@/lib/images/uploadType";
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
const isDev = process.env.NODE_ENV !== "production";

function debugLog(message: string, payload?: unknown) {
  if (isDev) console.log(message, payload);
}

function debugWarn(message: string, payload?: unknown) {
  if (isDev) console.warn(message, payload);
}

function countByType(uploads: UploadInput[]) {
  return uploads.reduce<Record<string, number>>((acc, upload) => {
    const type = normalizeUploadType(upload.type);
    acc[type] = (acc[type] ?? 0) + 1;
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

  debugLog("[Upload gallery input]", {
    invitationId: invitation.id,
    galleryEnabled: invitation.gallery?.enabled,
    galleryImagesCount: invitation.gallery?.images?.length ?? 0,
    galleryItemsCount: invitation.galleryItems?.length ?? 0,
    galleryItemsNormalized: galleryItems.length,
    galleryItemsWithFile: galleryItems.filter((img) => img.file).length,
    galleryItemsWithHttps: galleryItems.filter((img) => img.url?.startsWith("http")).length,
    pendingGalleryCount: pendingUploads.filter((u) => normalizeUploadType(u.type) === "gallery").length,
    extraGalleryCount: extraGalleryUploads.length,
    extraGalleryIds: extraGalleryUploads.map((u) => u.id),
  });

  debugLog("[Image assets collected]", { total: uploads.length, byType: countByType(uploads) });

  if (uploads.length === 0) {
    debugWarn("[uploadInvitationImages] no uploads — pendingUploads empty and no gallery items have files", {
      invitationId: invitation.id,
      galleryItemsCount: galleryItems.length,
      gallerySource: invitation.gallery?.images?.length ? "gallery.images" : "galleryItems",
    });
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
      const uploadType = normalizeUploadType(upload.type);
      debugLog("[Storage upload start]", {
        rawType: upload.type,
        type: uploadType,
        id: upload.id,
        fileType: upload.file.type,
        fileSize: upload.file.size,
      });
      if (uploadType === "audio") {
        debugLog("[Audio upload start]", { id: upload.id, fileType: upload.file.type, fileSize: upload.file.size });
      }

      const formData = new FormData();
      formData.append("file", upload.file);
      formData.append("id", upload.id);
      formData.append("type", uploadType);
      formData.append("invitationId", invitation.id);

      const result = await uploadInvitationFileAction(formData);
      debugLog("[Storage upload success]", { rawType: upload.type, type: uploadType, hasPublicUrl: Boolean(result.publicUrl) });
      if (uploadType === "audio") debugLog("[Audio upload success]", { hasPublicUrl: Boolean(result.publicUrl) });
      return result;
    }),
  );

  results.forEach((result, index) => {
    const upload = uploads[index];
    const uploadType = normalizeUploadType(upload.type);
    completed++;

    if (result.status === "rejected") {
      failed++;
      console.warn("[Storage upload failed]", {
        rawType: upload.type,
        type: uploadType,
        id: upload.id,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      onProgress?.({ total, completed, failed });
      return;
    }

    const publicUrl = result.value.publicUrl;
    if (!publicUrl) {
      failed++;
      console.warn("[Storage upload failed]", { rawType: upload.type, type: uploadType, id: upload.id, error: "missing publicUrl" });
      onProgress?.({ total, completed, failed });
      return;
    }

    if (uploadType === "main") {
      updatedInvitation.coverImage = publicUrl;
    } else if (uploadType === "intro") {
      updatedInvitation.introImage = publicUrl;
    } else if (uploadType === "quote") {
      updatedInvitation.quoteImage = publicUrl;
    } else if (uploadType === "kakao_thumbnail") {
      updatedInvitation.kakaoThumbnailUrl = publicUrl;
    } else if (uploadType === "url_thumbnail") {
      updatedInvitation.urlThumbnailUrl = publicUrl;
    } else if (uploadType === "audio") {
      updatedInvitation.audioUrl = publicUrl;
      updatedInvitation.musicUrl = publicUrl;
    } else if (uploadType === "gallery") {
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

  debugLog("[uploadInvitationImages] complete", {
    invitationId: updatedInvitation.id,
    imageCount: updatedInvitation.galleryItems.length,
    failedCount: failed,
  });

  return { invitation: updatedInvitation, failedCount: failed };
}
