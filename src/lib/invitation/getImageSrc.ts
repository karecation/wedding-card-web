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
  return image.previewUrl || image.url || image.dataUrl || "";
}

// 대표사진 src 결정. 여러 데이터 형식(NormalizedInvitation, SavedInvitation,
// IntroSection만 받는 경우 등)에서 호환성 있게 추출.
//
// 받을 수 있는 형태:
//   - NormalizedInvitation: { intro: { mainImageUrl, mainImagePreviewUrl }, ... }
//   - SavedInvitation/InvitationData: { coverImage, introImage }
//   - intro section만: { mainImageUrl, mainImagePreviewUrl, mainImage }
//   - 임의의 객체 wrappers
export function getMainImageSrc(input: unknown): string {
  if (!input) return "";
  // 문자열을 직접 받은 경우
  if (typeof input === "string") return input;
  const inv = input as Record<string, unknown>;
  // input이 NormalizedInvitation일 때 intro 객체. input이 intro section 자체일 때 input.
  const intro = (inv.intro ?? inv) as Record<string, unknown>;

  return (
    getImageSrc(intro?.mainImage as ImageLike) ||
    (typeof intro?.mainImagePreviewUrl === "string" ? (intro.mainImagePreviewUrl as string) : "") ||
    (typeof intro?.mainImageUrl === "string" ? (intro.mainImageUrl as string) : "") ||
    getImageSrc(inv.mainImage as ImageLike) ||
    getImageSrc(inv.introImage as ImageLike) ||
    getImageSrc(inv.coverImage as ImageLike) ||
    (typeof inv.mainImageUrl === "string" ? (inv.mainImageUrl as string) : "") ||
    (typeof inv.introImageUrl === "string" ? (inv.introImageUrl as string) : "") ||
    (typeof inv.coverImageUrl === "string" ? (inv.coverImageUrl as string) : "") ||
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
