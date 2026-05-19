"use client";

import { useState } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export type GuestbookEntry = {
  guestName?: string;
  guest_name?: string;
  message: string;
  createdAt?: string;
  created_at?: string;
};

const previewEntries: GuestbookEntry[] = [
  { guestName: "친구", message: "두 분의 결혼을 진심으로 축하합니다.", createdAt: "2026-05-19" },
  { guestName: "가족", message: "늘 오늘처럼 아름다운 날들이 이어지길 바랍니다.", createdAt: "2026-05-19" },
  { guestName: "동료", message: "행복한 시작을 응원합니다.", createdAt: "2026-05-19" },
];

export default function GuestbookSection({
  invitation,
  mode,
  entries = [],
  onSubmit,
}: {
  invitation: NormalizedInvitation;
  mode: "preview" | "public";
  entries?: GuestbookEntry[];
  onSubmit?: (entry: { guest_name: string; message: string }) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  if (!invitation.guestbook.enabled) return null;

  const visible = entries.length > 0 ? entries : mode === "preview" ? previewEntries : [];
  const submit = async () => {
    await onSubmit?.({ guest_name: name, message: body });
    setName("");
    setBody("");
    setMessage("방명록이 등록되었습니다.");
  };

  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">GUESTBOOK</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.guestbook.title}</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>

      <div className="mt-8 space-y-3">
        {visible.length > 0 ? (
          visible.map((entry, index) => (
            <article key={`${entry.guestName || entry.guest_name}-${index}`} className="rounded-[14px] border border-[var(--invite-border)] bg-white/60 px-4 py-4">
              <div className="flex items-center justify-between text-[11px] text-[#b5a39a]">
                <span>{entry.guestName || entry.guest_name || "하객"}</span>
                <span>{String(entry.createdAt || entry.created_at || "").slice(0, 10)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[var(--invite-muted)]">{entry.message}</p>
            </article>
          ))
        ) : (
          <p className="rounded-[14px] border border-dashed border-[var(--invite-border)] px-4 py-5 text-center text-[12px] text-[var(--invite-muted)]">
            아직 등록된 방명록이 없습니다.
          </p>
        )}
      </div>

      <div className="mt-5 text-center">
        <button type="button" onClick={() => setIsOpen((value) => !value)} className="rounded-full border border-[var(--invite-border)] px-5 py-2 text-[12px] text-[var(--invite-text)]">
          작성하기
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className="h-10 w-full rounded border border-[var(--invite-border)] px-3 text-[13px]" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="축하 메시지" rows={3} className="w-full rounded border border-[var(--invite-border)] px-3 py-2 text-[13px]" />
          <button type="button" onClick={submit} className="h-10 w-full rounded-full bg-[var(--invite-accent)] text-[13px] text-white">등록하기</button>
          {message && <p className="text-center text-[12px] text-[var(--invite-muted)]">{message}</p>}
        </div>
      )}
    </section>
  );
}
