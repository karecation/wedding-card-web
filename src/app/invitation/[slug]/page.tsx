import type { Metadata } from "next";
import { getInvitationBySlugAction } from "@/app/actions/invitationActions";
import SharedInvitationPage from "@/app/i/[slug]/page";

type MetadataProps = {
  params: Promise<{ slug: string }>;
};

function getPublicBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

function toAbsoluteUrl(value: string | undefined, baseUrl: string) {
  if (!value) return "";

  try {
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    if (!baseUrl) return "";
    return new URL(value, baseUrl).toString();
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
      return {
        title: "SAVE THE DATE",
        description: "모바일 청첩장을 확인해 주세요.",
        openGraph: {
          title: "SAVE THE DATE",
          description: "모바일 청첩장을 확인해 주세요.",
          type: "website",
          ...(pageUrl ? { url: pageUrl } : {}),
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
    const imageUrl = toAbsoluteUrl(
      invitation.urlThumbnailUrl || invitation.kakaoThumbnailUrl || invitation.coverImage || invitation.introImage,
      baseUrl,
    );

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(pageUrl ? { url: pageUrl } : {}),
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] } : {}),
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
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
      },
    };
  }
}

export default SharedInvitationPage;
