"use client";

import AccountSection from "@/components/invitation/AccountSection";
import CalendarSection from "@/components/invitation/CalendarSection";
import GallerySection from "@/components/invitation/GallerySection";
import GreetingSection from "@/components/invitation/GreetingSection";
import GuestbookSection, { type GuestbookEntry } from "@/components/invitation/GuestbookSection";
import IntroSection from "@/components/invitation/IntroSection";
import LocationSection from "@/components/invitation/LocationSection";
import RsvpSection from "@/components/invitation/RsvpSection";
import ShareFooter from "@/components/invitation/ShareFooter";
import { normalizeInvitation, type NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";
import type { MenuSectionId } from "@/types/invitation";

type RsvpForm = {
  guest_name: string;
  phone_last4: string;
  attending: boolean;
  meal: boolean;
  companions: number;
  message: string;
};

type Props = {
  invitation: unknown;
  mode: "preview" | "public";
  guestbookEntries?: GuestbookEntry[];
  onRsvpSubmit?: (form: RsvpForm) => Promise<void>;
  onGuestbookSubmit?: (entry: { guest_name: string; message: string }) => Promise<void>;
};

const themeTokens: Record<NormalizedInvitation["design"]["themeColor"], { bg: string; card: string; text: string; muted: string; border: string; accentSoft: string }> = {
  ivory: { bg: "#fbf7ef", card: "#fffdf8", text: "#34251f", muted: "#7a665d", border: "#eaded3", accentSoft: "#caa79b" },
  beige: { bg: "#f4efe8", card: "#fffaf4", text: "#332820", muted: "#78675c", border: "#e0d3c2", accentSoft: "#b78f72" },
  pink: { bg: "#fff6f6", card: "#fffafa", text: "#372026", muted: "#86696d", border: "#efd8d8", accentSoft: "#d8a0a6" },
};

function sectionDivider() {
  return <div className="mx-7 h-px bg-[var(--invite-border)]" />;
}

function VideoSection({ invitation }: { invitation: NormalizedInvitation }) {
  if (!invitation.video.enabled || !invitation.video.youtubeVideoId) return null;
  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">VIDEO</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">동영상</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>
      <div className="mt-8 aspect-video overflow-hidden rounded-[12px] bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${invitation.video.youtubeVideoId}`}
          title="웨딩 동영상"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function QuoteSection({ invitation }: { invitation: NormalizedInvitation }) {
  if (!invitation.quote.enabled || (!invitation.quote.imageUrl && !invitation.quote.text)) return null;
  return (
    <section className="px-7 py-12 text-center">
      {invitation.quote.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={invitation.quote.imageUrl} alt="사진과 글귀" loading="lazy" className="mx-auto max-h-[360px] w-full rounded-[14px] object-cover" />
      )}
      {invitation.quote.text && <p className="mx-auto mt-6 max-w-[300px] whitespace-pre-line text-[14px] leading-[2] text-[var(--invite-muted)]">{invitation.quote.text}</p>}
    </section>
  );
}

function AudioSection({ invitation }: { invitation: NormalizedInvitation }) {
  if (!invitation.audio.url) return null;
  return (
    <section className="px-7 py-7">
      <audio src={invitation.audio.url} controls className="w-full" />
      <p className="mt-2 text-[11px] leading-5 text-[#ad9d96]">업로드한 음원의 저작권 책임은 사용자에게 있습니다.</p>
    </section>
  );
}

function NoticeSection({ invitation, mode }: { invitation: NormalizedInvitation; mode: "preview" | "public" }) {
  if (!invitation.notice.enabled) return null;
  const body = invitation.notice.groupBody || invitation.notice.separateBody;
  const title = invitation.notice.groupTitle || invitation.notice.separateTitle;
  if (!body) return null;

  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">INFORMATION</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{title}</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>
      <div className="mt-8 rounded-[14px] border border-[var(--invite-border)] bg-white/60 px-4 py-4">
        <p className="whitespace-pre-line text-[13px] leading-7 text-[var(--invite-muted)]">
          {body}
        </p>
      </div>
    </section>
  );
}

function renderSection(id: MenuSectionId, props: Props, normalized: NormalizedInvitation) {
  if (id === "intro") return null;
  if (id === "greeting") return <GreetingSection invitation={normalized} />;
  if (id === "calendar") return <CalendarSection invitation={normalized} />;
  if (id === "gallery") return <GallerySection invitation={normalized} mode={props.mode} />;
  if (id === "video") return <VideoSection invitation={normalized} />;
  if (id === "location") return <LocationSection invitation={normalized} />;
  if (id === "rsvp") return <RsvpSection invitation={normalized} onSubmit={props.onRsvpSubmit} />;
  if (id === "accounts") return <AccountSection invitation={normalized} />;
  if (id === "notice") return <NoticeSection invitation={normalized} mode={props.mode} />;
  if (id === "guestbook") {
    return (
      <GuestbookSection
        invitation={normalized}
        mode={props.mode}
        entries={props.guestbookEntries}
        onSubmit={props.onGuestbookSubmit}
      />
    );
  }
  if (id === "quote") return <QuoteSection invitation={normalized} />;
  return null;
}

// 이미 normalize된 객체인지 감지 — 이중 normalize 방지 (기존 normalize는 flat coverImage를 읽기 때문에
// NormalizedInvitation을 다시 normalize하면 image url이 손실됨)
function isAlreadyNormalized(input: unknown): input is NormalizedInvitation {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  const intro = obj.intro as Record<string, unknown> | undefined;
  const design = obj.design as Record<string, unknown> | undefined;
  const basic = obj.basic as Record<string, unknown> | undefined;
  return Boolean(
    intro && typeof intro === "object" && ("mainImageUrl" in intro || "mainImagePreviewUrl" in intro) &&
    design && typeof design === "object" && "themeColor" in design &&
    basic && typeof basic === "object" && "groomName" in basic,
  );
}

export default function InvitationRenderer(props: Props) {
  const invitation = isAlreadyNormalized(props.invitation)
    ? props.invitation
    : normalizeInvitation(props.invitation);

  if (typeof window !== "undefined") {
    console.log("[InvitationRenderer before IntroSection]", {
      wasAlreadyNormalized: isAlreadyNormalized(props.invitation),
      rootKeys: invitation ? Object.keys(invitation) : [],
      introKeys: invitation?.intro ? Object.keys(invitation.intro) : [],
      introMainImageUrl: invitation?.intro?.mainImageUrl,
      introMainImagePreviewUrl: invitation?.intro?.mainImagePreviewUrl,
      galleryImageCount: invitation?.gallery?.images?.length ?? 0,
      firstGalleryUrl: invitation?.gallery?.images?.[0]?.url,
      quoteImageUrl: invitation?.quote?.imageUrl,
    });
  }

  const tokens = themeTokens[invitation.design.themeColor];
  const weight = invitation.design.fontWeight === "light" ? 300 : invitation.design.fontWeight === "medium" ? 600 : 400;
  const fontScale = invitation.design.fontWeight === "light" ? 0.97 : invitation.design.fontWeight === "medium" ? 1.06 : 1;

  const style = {
    "--invite-bg": tokens.bg,
    "--invite-card": tokens.card,
    "--invite-text": tokens.text,
    "--invite-muted": tokens.muted,
    "--invite-border": tokens.border,
    "--invite-accent": invitation.design.accentColor || "#c9897a",
    "--invite-accent-soft": tokens.accentSoft,
    fontWeight: weight,
    fontSize: `${fontScale * 100}%`,
  } as React.CSSProperties;

  const visibleSections = invitation.menuOrder
    .map((id) => ({ id, node: renderSection(id, props, invitation) }))
    .filter((item) => item.node);

  return (
    <article
      className="invitation-renderer mx-auto w-full max-w-[430px] overflow-hidden rounded-[10px] border border-[var(--invite-border)] bg-[var(--invite-card)] text-[var(--invite-text)] shadow-[0_8px_24px_rgba(70,50,40,0.06)]"
      data-font={invitation.design.fontFamily}
      style={style}
    >
      <IntroSection invitation={invitation} />
      {visibleSections.map((item, index) => (
        <div key={item.id} className={invitation.design.revealOnScroll ? "invite-reveal" : undefined}>
          {sectionDivider()}
          {item.node}
        </div>
      ))}
      <AudioSection invitation={invitation} />
      <div>{sectionDivider()}<ShareFooter /></div>
    </article>
  );
}
