"use client";

import { useState } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

type RsvpForm = {
  guest_name: string;
  phone_last4: string;
  attending: boolean;
  meal: boolean;
  companions: number;
  message: string;
};

export default function RsvpSection({
  invitation,
  onSubmit,
}: {
  invitation: NormalizedInvitation;
  onSubmit?: (form: RsvpForm) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RsvpForm>({
    guest_name: "",
    phone_last4: "",
    attending: true,
    meal: true,
    companions: 0,
    message: "",
  });
  const [message, setMessage] = useState("");

  if (!invitation.rsvp.enabled) return null;

  const submit = async () => {
    setMessage("");
    await onSubmit?.(form);
    setMessage("참석 의사가 전달되었습니다.");
    setForm({ guest_name: "", phone_last4: "", attending: true, meal: true, companions: 0, message: "" });
  };

  return (
    <section className="px-7 py-14">
      <div className="relative mx-auto max-w-[330px] rounded-[24px] border border-[var(--invite-border)] bg-[linear-gradient(180deg,rgba(255,255,255,.82),rgba(255,249,246,.72))] px-6 pb-7 pt-10 text-center shadow-[0_12px_30px_rgba(92,62,45,0.06)]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#f4d8d5] px-5 py-2 text-[11px] font-semibold tracking-[-0.01em] text-[#9c6b61] shadow-[0_4px_14px_rgba(150,105,92,0.08)]">
          {invitation.rsvp.title || "참석 의사 전달"}
        </div>

        <p className="mx-auto max-w-[250px] whitespace-pre-line text-[13px] leading-7 text-[var(--invite-muted)]">
          {invitation.rsvp.body}
        </p>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#e4cfc7] bg-white/80 px-6 text-[13px] font-semibold text-[#6f5148] shadow-[0_5px_16px_rgba(100,70,58,0.05)] transition hover:bg-white"
        >
          {invitation.rsvp.buttonText || "참석 의사 전달하기"}
        </button>

        {isOpen && (
          <div className="mt-6 space-y-2 text-left">
            <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="이름" className="h-10 w-full rounded-[10px] border border-[var(--invite-border)] bg-white/80 px-3 text-[13px] outline-none" />
            <input value={form.phone_last4} onChange={(e) => setForm({ ...form, phone_last4: e.target.value })} placeholder="연락처 뒤 4자리" className="h-10 w-full rounded-[10px] border border-[var(--invite-border)] bg-white/80 px-3 text-[13px] outline-none" />
            <div className="flex flex-wrap gap-3 px-1 text-[12px] text-[var(--invite-muted)]">
              <label className="inline-flex items-center gap-1"><input type="radio" checked={form.attending} onChange={() => setForm({ ...form, attending: true })} /> 참석</label>
              <label className="inline-flex items-center gap-1"><input type="radio" checked={!form.attending} onChange={() => setForm({ ...form, attending: false })} /> 불참</label>
              <label className="inline-flex items-center gap-1"><input type="checkbox" checked={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.checked })} /> 식사</label>
            </div>
            <input type="number" min={0} value={form.companions} onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })} placeholder="동행인 수" className="h-10 w-full rounded-[10px] border border-[var(--invite-border)] bg-white/80 px-3 text-[13px] outline-none" />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="전달사항" rows={3} className="w-full rounded-[10px] border border-[var(--invite-border)] bg-white/80 px-3 py-2 text-[13px] outline-none" />
            <button type="button" onClick={submit} className="h-10 w-full rounded-full bg-[var(--invite-accent)] text-[13px] font-semibold text-white">전달하기</button>
            {message && <p className="text-center text-[12px] text-[var(--invite-muted)]">{message}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
