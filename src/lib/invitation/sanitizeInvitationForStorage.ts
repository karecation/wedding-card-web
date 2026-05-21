import { emptyInvitationData, type GalleryImage, type SavedInvitation } from "@/types/invitation";

// HTTPS URL만 반환 (Supabase 업로드 성공한 영구 URL)
function httpsUrlOnly(value?: string) {
  if (!value) return "";
  if (value.startsWith("https://")) return value;
  return "";
}

// 영구적으로 사용 가능한 URL 추출: HTTPS > base64 dataUrl > 빈 문자열
// blob: URL은 페이지 세션 간에 유효하지 않으므로 제외
function persistableImageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("https://")) return value;
  if (value.startsWith("data:")) return value; // base64는 fallback으로 유지 (Supabase 없을 때)
  return ""; // blob: 및 기타 무효 URL 제거
}

function sanitizeGalleryImage(image: GalleryImage, index: number): GalleryImage {
  // HTTPS URL 우선, 없으면 dataUrl(base64), 그것도 없으면 빈 문자열
  const httpsUrl =
    httpsUrlOnly(image.url) || httpsUrlOnly(image.previewUrl);
  const fallbackDataUrl =
    (image.dataUrl && image.dataUrl.startsWith("data:") && image.dataUrl) ||
    (image.url && image.url.startsWith("data:") && image.url) ||
    (image.previewUrl && image.previewUrl.startsWith("data:") && image.previewUrl) ||
    "";
  const url = httpsUrl || fallbackDataUrl || "";

  return {
    id: image.id || `gallery-${index}`,
    url,
    previewUrl: url,
    // Supabase 업로드 성공 시 dataUrl 제거 (용량 절약), 실패 시 fallback으로 유지
    dataUrl: httpsUrl ? undefined : fallbackDataUrl || undefined,
    caption: image.caption ?? "",
    order: index,
    uploadStatus: image.uploadStatus === "failed" ? "failed" : url ? "uploaded" : image.uploadStatus,
    type: "gallery",
  };
}

export function sanitizeInvitationForStorage(invitation: SavedInvitation): SavedInvitation {
  const gallerySource = invitation.gallery?.images?.length ? invitation.gallery.images : invitation.galleryItems;
  const galleryImages = (gallerySource ?? [])
    .map(sanitizeGalleryImage)
    .filter((image) => image.url || image.dataUrl);

  const coverImage = persistableImageUrl(invitation.coverImage) || persistableImageUrl(invitation.introImage);
  const introImage = persistableImageUrl(invitation.introImage) || coverImage;
  const quoteImage = persistableImageUrl(invitation.quoteImage);
  const kakaoThumbnailUrl = persistableImageUrl(invitation.kakaoThumbnailUrl);
  const urlThumbnailUrl = persistableImageUrl(invitation.urlThumbnailUrl);

  return {
    ...invitation,
    coverImage,
    introImage,
    quoteImage,
    kakaoThumbnailUrl,
    urlThumbnailUrl,
    gallery: {
      ...(invitation.gallery ?? emptyInvitationData.gallery),
      enabled: invitation.gallery?.enabled ?? galleryImages.length > 0,
      images: galleryImages,
    },
    galleryItems: galleryImages,
    galleryImages: galleryImages.map((image) => image.url || image.dataUrl || "").filter(Boolean),
  };
}
