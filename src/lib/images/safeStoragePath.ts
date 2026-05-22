const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

const TYPE_TO_SECTION: Record<string, string> = {
  main: "main",
  intro: "main",
  gallery: "gallery",
  quote: "photo-quote",
  photoQuote: "photo-quote",
  "photo-quote": "photo-quote",
  kakao_thumbnail: "share",
  kakaoThumbnail: "share",
  url_thumbnail: "share",
  urlThumbnail: "share",
  shareThumbnail: "share",
  share: "share",
  audio: "audio",
};

export function getExtensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXT[mimeType.toLowerCase()] ?? "";
}

export function getSafeStoragePath({
  invitationId,
  type,
  imageId,
  mimeType,
}: {
  invitationId: string;
  type: string;
  imageId: string;
  mimeType: string;
}): string {
  const ext = getExtensionFromMimeType(mimeType) || "jpg";
  const section = TYPE_TO_SECTION[type] ?? type;
  // invitationId와 imageId는 UUID여야 하지만, 혹시 모를 비ASCII 문자를 방어적으로 제거
  const safeInvitationId = invitationId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const safeImageId = imageId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return `invitations/${safeInvitationId}/${section}/${safeImageId}.${ext}`;
}
