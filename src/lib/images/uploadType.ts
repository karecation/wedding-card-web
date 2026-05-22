export type CanonicalUploadType =
  | "main"
  | "intro"
  | "gallery"
  | "quote"
  | "kakao_thumbnail"
  | "url_thumbnail"
  | "audio";

export function normalizeUploadType(type: string): CanonicalUploadType {
  if (type === "photoQuote" || type === "photo-quote") return "quote";
  if (type === "kakaoThumbnail") return "kakao_thumbnail";
  if (type === "urlThumbnail") return "url_thumbnail";
  if (type === "shareThumbnail" || type === "share") return "url_thumbnail";
  if (type === "audio") return "audio";
  if (type === "main") return "main";
  if (type === "intro") return "intro";
  if (type === "gallery") return "gallery";
  if (type === "kakao_thumbnail") return "kakao_thumbnail";
  if (type === "url_thumbnail") return "url_thumbnail";
  return "quote";
}
