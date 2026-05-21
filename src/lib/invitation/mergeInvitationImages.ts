import type { InvitationImageRow } from "@/app/actions/invitationActions";
import { emptyInvitationData, type GalleryImage, type SavedInvitation } from "@/types/invitation";

/**
 * invitation_images 테이블 행을 SavedInvitation 데이터에 머지합니다.
 *
 * type 매핑:
 *  - "main" | "intro" → coverImage, introImage
 *  - "gallery"        → galleryItems, gallery.images, galleryImages (sort_order 기준 정렬)
 *  - "photo-quote" | "quote" → quoteImage
 *  - "share"          → kakaoThumbnailUrl (caption === "kakao"), urlThumbnailUrl (caption === "url" 또는 첫 번째)
 *
 * imageRows가 비어 있으면 invitation을 그대로 반환 (settings JSONB의 기존 URL 유지).
 */
export function mergeInvitationImages(
  invitation: SavedInvitation,
  imageRows: InvitationImageRow[] | null | undefined,
): SavedInvitation {
  const rows = (imageRows ?? []).filter((row) => row.url && row.url.startsWith("https://"));

  if (rows.length === 0) {
    console.log("[Preview image merge]", {
      hasMainImage: Boolean(invitation.coverImage || invitation.introImage),
      galleryCount: invitation.galleryItems?.length ?? 0,
      hasPhotoQuote: Boolean(invitation.quoteImage),
      hasShareThumbnail: Boolean(invitation.kakaoThumbnailUrl || invitation.urlThumbnailUrl),
    });
    return invitation;
  }

  const mainRow = rows.find((row) => row.type === "main" || row.type === "intro");
  const galleryRows = rows
    .filter((row) => row.type === "gallery")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const photoQuoteRow = rows.find((row) => row.type === "photo-quote" || row.type === "quote");
  const shareRows = rows.filter((row) => row.type === "share");
  const kakaoShare = shareRows.find((row) => row.caption === "kakao")?.url;
  const urlShare = shareRows.find((row) => row.caption === "url")?.url ?? shareRows[0]?.url;

  const merged: SavedInvitation = {
    ...invitation,
    coverImage: mainRow?.url ?? invitation.coverImage ?? "",
    introImage: mainRow?.url ?? invitation.introImage ?? "",
    quoteImage: photoQuoteRow?.url ?? invitation.quoteImage ?? "",
    kakaoThumbnailUrl: kakaoShare ?? invitation.kakaoThumbnailUrl ?? "",
    urlThumbnailUrl: urlShare ?? invitation.urlThumbnailUrl ?? "",
  };

  if (galleryRows.length > 0) {
    const galleryImages: GalleryImage[] = galleryRows.map((row, index) => ({
      id: row.id,
      url: row.url,
      previewUrl: row.url,
      caption: row.caption ?? "",
      order: row.sort_order ?? index,
      type: "gallery" as const,
      uploadStatus: "uploaded" as const,
    }));
    const currentGallery = invitation.gallery ?? emptyInvitationData.gallery;
    merged.galleryItems = galleryImages;
    merged.galleryImages = galleryImages.map((img) => img.url ?? "").filter(Boolean);
    merged.gallery = {
      ...currentGallery,
      images: galleryImages,
      enabled: currentGallery.enabled || galleryImages.length > 0,
    };
  }

  console.log("[Preview image merge]", {
    hasMainImage: Boolean(merged.coverImage || merged.introImage),
    galleryCount: merged.galleryItems?.length ?? 0,
    hasPhotoQuote: Boolean(merged.quoteImage),
    hasShareThumbnail: Boolean(merged.kakaoThumbnailUrl || merged.urlThumbnailUrl),
  });

  return merged;
}
