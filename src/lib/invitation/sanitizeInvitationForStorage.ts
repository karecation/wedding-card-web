import { emptyInvitationData, type GalleryImage, type SavedInvitation } from "@/types/invitation";

function persistableImageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("blob:")) return "";
  if (value.startsWith("data:")) return ""; // base64는 localStorage/DB에 저장하지 않음
  return value;
}

function sanitizeGalleryImage(image: GalleryImage, index: number): GalleryImage {
  const url = persistableImageUrl(image.url) || persistableImageUrl(image.previewUrl);
  return {
    id: image.id || `gallery-${index}`,
    url,
    previewUrl: url,
    dataUrl: undefined, // base64 dataUrl은 저장하지 않음
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
    .filter((image) => image.url || image.dataUrl || image.previewUrl);

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
    galleryImages: galleryImages.map((image) => image.url || image.dataUrl || image.previewUrl).filter(Boolean),
  };
}
