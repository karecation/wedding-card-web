"use client";

import { useState } from "react";

export default function ShareFooter() {
  const [message, setMessage] = useState("");

  const copy = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setMessage("링크가 복사되었습니다.");
    window.setTimeout(() => setMessage(""), 1600);
  };

  return (
    <footer className="px-7 py-10 text-center">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="rounded-full border border-[var(--invite-border)] py-2.5 text-[12px] text-[var(--invite-text)]" onClick={() => setMessage("카카오 공유 키를 연결하면 사용할 수 있습니다.")}>
          카카오톡 공유하기
        </button>
        <button type="button" className="rounded-full bg-[var(--invite-accent)] py-2.5 text-[12px] text-white" onClick={copy}>
          링크주소 복사하기
        </button>
      </div>
      {message && <p className="mt-3 text-[12px] text-[var(--invite-muted)]">{message}</p>}
      <p className="mt-8 text-[10px] tracking-[0.08em] text-[#b9aaa2]">
        Copyright 2026. Save The Date. All rights reserved.
      </p>
    </footer>
  );
}
