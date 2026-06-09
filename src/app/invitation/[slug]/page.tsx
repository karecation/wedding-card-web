import type { Metadata } from "next";
import { getInvitationBySlugAction } from "@/app/actions/invitationActions";
import SharedInvitationPage from "@/app/i/[slug]/page";
import { DEFAULT_PUBLIC_THUMBNAIL, getPublicBaseUrl, isPubliclyReachableUrl } from "@/lib/publicUrl";

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Resolve a publicly reachable absolute image URL for `og:image` / `twitter:image`.
 * Kakao/Naver/메신저 crawlers cannot fetch `blob:`, `data:`, `localhost`, or
 * relative URLs — these would either be dropped or render no preview.
 */
function toPublicImageUrl(value: string | undefined, baseUrl: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";

  // Already absolute — accept only if publicly reachable.
  if (v.startsWith("http://") || v.startsWith("https://")) {
    return isPubliclyReachableUrl(v) ? v : "";
  }

  // Disallowed schemes — never used in OG tags.
  if (v.startsWith("blob:") || v.startsWith("data:") || v.startsWith("file:")) return "";

  // Relative path — only usable when we have a public base origin.
  if (!baseUrl || !isPubliclyReachableUrl(baseUrl)) return "";
  try {
    const resolved = new URL(v, baseUrl).toString();
    return isPubliclyReachableUrl(resolved) ? resolved : "";
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const baseUrl = getPublicBaseUrl();
  const pageUrl = baseUrl ? `${baseUrl}/invitation/${encodeURIComponent(decodedSlug)}` : undefined;

  try {
    const invitation = await getInvitationBySlugAction(decodedSlug);
    if (!invitation) {
      // Fallback metadata still includes a default image so crawlers always
      // render a thumbnail. og:url is omitted when no public origin is known.
      return {
        title: "SAVE THE DATE",
        description: "모바일 청첩장을 확인해 주세요.",
        openGraph: {
          title: "SAVE THE DATE",
          description: "모바일 청첩장을 확인해 주세요.",
          type: "website",
          ...(pageUrl ? { url: pageUrl } : {}),
          images: [{ url: DEFAULT_PUBLIC_THUMBNAIL, width: 1200, height: 630, alt: "SAVE THE DATE" }],
        },
        twitter: {
          card: "summary_large_image",
          title: "SAVE THE DATE",
          description: "모바일 청첩장을 확인해 주세요.",
          images: [DEFAULT_PUBLIC_THUMBNAIL],
        },
      };
    }

    const coupleTitle = `${invitation.groomName || "신랑"} ♥ ${invitation.brideName || "신부"}`;
    const title = invitation.urlShareTitle || invitation.kakaoShareTitle || coupleTitle;
    const description =
      invitation.urlShareDescription ||
      invitation.kakaoShareDescription ||
      invitation.messageTitle ||
      "소중한 분들을 초대합니다.";

    // Share thumbnail priority — per spec: URL share thumb → Kakao share
    // thumb → main image → first gallery image → default public asset.
    const firstGallery = Array.isArray(invitation.galleryItems) && invitation.galleryItems.length > 0
      ? invitation.galleryItems[0]?.url ?? invitation.galleryItems[0]?.previewUrl
      : undefined;

    const imageUrl =
      toPublicImageUrl(invitation.urlThumbnailUrl, baseUrl) ||
      toPublicImageUrl(invitation.kakaoThumbnailUrl, baseUrl) ||
      toPublicImageUrl(invitation.coverImage, baseUrl) ||
      toPublicImageUrl(invitation.introImage, baseUrl) ||
      toPublicImageUrl(firstGallery, baseUrl) ||
      DEFAULT_PUBLIC_THUMBNAIL;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(pageUrl ? { url: pageUrl } : {}),
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.warn("[Invitation metadata load failed]", {
      slug: decodedSlug,
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      title: "SAVE THE DATE",
      description: "모바일 청첩장을 확인해 주세요.",
      openGraph: {
        title: "SAVE THE DATE",
        description: "모바일 청첩장을 확인해 주세요.",
        type: "website",
        ...(pageUrl ? { url: pageUrl } : {}),
        images: [{ url: DEFAULT_PUBLIC_THUMBNAIL, width: 1200, height: 630, alt: "SAVE THE DATE" }],
      },
      twitter: {
        card: "summary_large_image",
        title: "SAVE THE DATE",
        description: "모바일 청첩장을 확인해 주세요.",
        images: [DEFAULT_PUBLIC_THUMBNAIL],
      },
    };
  }
}

export default SharedInvitationPage;
