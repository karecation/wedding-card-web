"use client";

import { useState } from "react";

import { sendKakaoInvitationShare } from "@/lib/kakaoShare";

type ShareFooterProps = {
  title: string;
  description: string;
  imageUrl?: string;
};

function getCurrentShareUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export default function ShareFooter({ title, description, imageUrl }: ShareFooterProps) {
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const clearMessageSoon = () => {
    window.setTimeout(() => setMessage(""), 2200);
  };

  const copy = async () => {
    const url = getCurrentShareUrl();
    if (!url) {
      setMessage("공유할 주소를 확인할 수 없습니다.");
      clearMessageSoon();
      return;
    }

    await navigator.clipboard?.writeText(url);
    setMessage("링크가 복사되었습니다.");
    clearMessageSoon();
  };

  const shareToKakao = async () => {
    const webUrl = getCurrentShareUrl();
    if (!webUrl) {
      setMessage("공유할 청첩장 주소를 확인할 수 없습니다.");
      return;
    }

    setIsSharing(true);
    setMessage("");

    try {
      console.log("[KakaoShare click]", { hasImageUrl: Boolean(imageUrl), webUrl });
      await sendKakaoInvitationShare({
        title,
        description,
        imageUrl,
        webUrl,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "카카오톡 공유를 사용할 수 없습니다.";
      console.warn("[KakaoShare failed]", { reason });
      setMessage(`${reason} 카카오 JavaScript 키와 도메인 설정을 확인해 주세요.`);
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
