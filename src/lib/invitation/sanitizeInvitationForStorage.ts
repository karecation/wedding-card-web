import { emptyInvitationData, type GalleryImage, type SavedInvitation } from "@/types/invitation";

function publicUrlOnly(value?: string) {
  if (!value) return "";
  return value.startsWith("https://") || value.startsWith("http://") ? value : "";
}

function sanitizeGalleryImage(image: GalleryImage, index: number): GalleryImage | null {
  const url = publicUrlOnly(image.url) || publicUrlOnly(image.previewUrl) || publicUrlOnly(image.dataUrl);
  if (!url) return null;

  return {
    id: image.id || `gallery-${index}`,
    url,
    previewUrl: url,
    dataUrl: undefined,
    caption: image.caption ?? "",
    order: index,
    uploadStatus: "uploaded",
    type: "gallery",
  };
}

export function sanitizeInvitationForStorage(invitation: SavedInvitation): SavedInvitation {
  const gallerySource = invitation.gallery?.images?.length ? invitation.gallery.images : invitation.galleryItems;
  const galleryImages = (gallerySource ?? [])
    .map(sanitizeGalleryImage)
    .filter((image): image is GalleryImage => Boolean(image));

  const coverImage = publicUrlOnly(invitation.coverImage) || publicUrlOnly(invitation.introImage);
  const introImage = publicUrlOnly(invitation.introImage) || coverImage;
  const quoteImage = publicUrlOnly(invitation.quoteImage);
  const kakaoThumbnailUrl = publicUrlOnly(invitation.kakaoThumbnailUrl);
  const urlThumbnailUrl = publicUrlOnly(invitation.urlThumbnailUrl);

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
    galleryImages: galleryImages.map((image) => image.url || "").filter(Boolean),
  };
}
