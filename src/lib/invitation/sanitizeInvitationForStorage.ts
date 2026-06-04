import { emptyInvitationData, type GalleryImage, type SavedInvitation } from "@/types/invitation";

function publicUrlOnly(value?: string) {
  if (!value) return "";
  // https/http URL과 base64 data URL 모두 유효한 저장 대상으로 허용.
  // blob: URL은 세션 종료 후 유효하지 않으므로 제거한다.
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("data:")) return value;
  return "";
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
  const firstTransport = invitation.transports[0];
  const location = {
    venueName: invitation.location?.venueName || invitation.venueName,
    hallName: invitation.location?.hallName || invitation.venueHall,
    address: invitation.location?.address || invitation.venueAddress,
    detailAddress: invitation.location?.detailAddress || "",
    lat: invitation.location?.lat ?? invitation.latitude ?? undefined,
    lng: invitation.location?.lng ?? invitation.longitude ?? undefined,
    transportTitle: invitation.location?.transportTitle || firstTransport?.title || "",
    transportDescription: invitation.location?.transportDescription || firstTransport?.description || "",
  };

  const audioUrl = publicUrlOnly(invitation.audioUrl);
  const musicUrl = publicUrlOnly(invitation.musicUrl);

  return {
    ...invitation,
    venueName: location.venueName,
    venueHall: location.hallName,
    venueAddress: location.address,
    latitude: location.lat ?? null,
    longitude: location.lng ?? null,
    location,
    coverImage,
    introImage,
    quoteImage,
    kakaoThumbnailUrl,
    urlThumbnailUrl,
    audioUrl,
    musicUrl,
    gallery: {
      ...(invitation.gallery ?? emptyInvitationData.gallery),
      enabled: invitation.gallery?.enabled ?? galleryImages.length > 0,
      images: galleryImages,
    },
    galleryItems: galleryImages,
    galleryImages: galleryImages.map((image) => image.url || "").filter(Boolean),
  };
}
