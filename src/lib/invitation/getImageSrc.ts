// 어떤 형태의 이미지 데이터든 <img src>로 쓸 수 있는 문자열로 변환.
// - string이면 그대로
// - { url, dataUrl, previewUrl } 객체면 url > dataUrl > previewUrl 순
// - falsy면 빈 문자열
type ImageLike =
  | string
  | { url?: string | null; dataUrl?: string | null; previewUrl?: string | null }
  | null
  | undefined;

export function getImageSrc(image?: ImageLike): string {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.dataUrl || image.previewUrl || "";
}

// 대표사진 src 결정. 여러 데이터 형식(NormalizedInvitation, SavedInvitation,
// 외부에서 들어오는 임의 객체)에서 호환성 있게 추출.
export function getMainImageSrc(invitation: unknown): string {
  const inv = (invitation ?? {}) as Record<string, unknown>;
  const intro = (inv.intro ?? {}) as Record<string, unknown>;

  return (
    getImageSrc(intro.mainImage as ImageLike) ||
    getImageSrc(inv.mainImage as ImageLike) ||
    getImageSrc(inv.introImage as ImageLike) ||
    getImageSrc(inv.coverImage as ImageLike) ||
    (typeof intro.mainImageUrl === "string" ? intro.mainImageUrl : "") ||
    (typeof intro.mainImagePreviewUrl === "string" ? intro.mainImagePreviewUrl : "") ||
    (typeof inv.mainImageUrl === "string" ? inv.mainImageUrl : "") ||
    (typeof inv.introImageUrl === "string" ? inv.introImageUrl : "") ||
    ""
  );
}

// 사진 & 글귀 이미지 src
export function getPhotoQuoteSrc(invitation: unknown): string {
  const inv = (invitation ?? {}) as Record<string, unknown>;
  const quote = (inv.quote ?? {}) as Record<string, unknown>;
  const photoQuote = (inv.photoQuote ?? {}) as Record<string, unknown>;

  return (
    getImageSrc(photoQuote.image as ImageLike) ||
    getImageSrc(quote.image as ImageLike) ||
    getImageSrc(inv.quoteImage as ImageLike) ||
    (typeof quote.imageUrl === "string" ? quote.imageUrl : "") ||
    (typeof inv.quoteImageUrl === "string" ? inv.quoteImageUrl : "") ||
    ""
  );
}
