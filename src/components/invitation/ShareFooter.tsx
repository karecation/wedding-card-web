"use client";

import { useState } from "react";

import { sendKakaoInvitationShare } from "@/lib/kakaoShare";
import {
  DEFAULT_PUBLIC_THUMBNAIL,
  buildPublicInvitationUrl,
  isPubliclyReachableUrl,
  pickPublicUrl,
} from "@/lib/publicUrl";

type ShareFooterProps = {
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
};

/**
 * Best-effort current share URL:
 *  - Prefers the configured public base URL when available (production).
 *  - Falls back to `${origin}/invitation/${slug}` when running on the same
 *    browser that holds the share button — useful for local link copy.
 *  - Returns "" if nothing usable.
 */
function resolveCurrentShareUrl(slug?: string): string {
  if (typeof window === "undefined") return "";

  const fromPublicBase = buildPublicInvitationUrl(slug);
  if (fromPublicBase) return fromPublicBase;

  if (slug) {
    const localUrl = `${window.location.origin}/invitation/${encodeURIComponent(slug)}`;
    return localUrl;
  }
  return window.location.href;
}

export default function ShareFooter({ title, description, imageUrl, slug }: ShareFooterProps) {
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const clearMessageSoon = () => {
    window.setTimeout(() => setMessage(""), 2400);
  };

  const copy = async () => {
    const url = resolveCurrentShareUrl(slug);
    if (!url) {
      setMessage("공유할 주소를 확인할 수 없습니다.");
      clearMessageSoon();
      return;
    }

    try {
      await navigator.clipboard?.writeText(url);
      setMessage("링크가 복사되었습니다.");
    } catch (error) {
      console.warn("[ShareFooter copy] failed", { error: error instanceof Error ? error.message : String(error) });
      setMessage("주소 복사에 실패했습니다. 직접 복사해 주세요.");
    }
    clearMessageSoon();
  };

  const shareToKakao = async () => {
    // Resolve a publicly reachable share URL.
    const candidateWebUrl = resolveCurrentShareUrl(slug);

    // Pick a publicly reachable thumbnail; falls back to the default
    // public asset so Kakao's preview render never receives blob/localhost.
    const safeImageUrl = pickPublicUrl(imageUrl, DEFAULT_PUBLIC_THUMBNAIL);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    if (!candidateWebUrl || !isPubliclyReachableUrl(candidateWebUrl)) {
      // Local development or unreachable origin — Kakao Picker would 500.
      // Fall back to copy-link so the dev still gets feedback.
      console.warn("[KakaoShare blocked] webUrl is not publicly reachable", {
        origin,
        candidateWebUrl,
        hasSafeImage: Boolean(safeImageUrl),
      });
      try {
        if (candidateWebUrl) await navigator.clipboard?.writeText(candidateWebUrl);
        setMessage("개발 환경에서는 카카오톡 공유 대신 링크가 복사되었습니다.");
      } catch {
        setMessage("개발 환경에서는 카카오톡 공유를 사용할 수 없습니다.");
      }
      clearMessageSoon();
      return;
    }

    setIsSharing(true);
    setMessage("");

    try {
      await sendKakaoInvitationShare({
        title,
        description,
        imageUrl: safeImageUrl,
        webUrl: candidateWebUrl,
      });
      console.log("[KakaoShare success]", {
        origin,
        webUrl: candidateWebUrl,
        imageUrl: safeImageUrl,
      });
    } catch (error) {
      const sdkError = error as { code?: unknown; message?: unknown } & Error;
      const reason = error instanceof Error ? error.message : "카카오톡 공유를 사용할 수 없습니다.";
      console.warn("[KakaoShare failed]", {
        origin,
        sdkInitialized: typeof window !== "undefined" && Boolean(window.Kakao?.isInitialized?.()),
        webUrl: candidateWebUrl,
        imageUrl: safeImageUrl,
        code: sdkError?.code,
        message: reason,
      });
      setMessage(`${reason} 카카오 JavaScript 키와 도메인 설정을 확인해 주세요.`);
      clearMessageSoon();
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <footer className="px-7 py-10 text-center">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-full border border-[var(--invite-border)] py-2.5 text-[12px] text-[var(--invite-text)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={shareToKakao}
          disabled={isSharing}
        >
          {isSharing ? "공유 준비 중" : "카카오톡 공유하기"}
        </button>
        <button
          type="button"
          className="rounded-full bg-[var(--invite-accent)] py-2.5 text-[12px] text-white transition hover:brightness-95"
          onClick={copy}
        >
          링크주소 복사하기
        </button>
      </div>
      {message && <p className="mt-3 text-[12px] leading-5 text-[var(--invite-muted)]">{message}</p>}
      <p className="mt-8 text-[10px] tracking-[0.08em] text-[#b9aaa2]">
        Copyright 2026. Save The Date. All rights reserved.
      </p>
    </footer>
  );
}
