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
    <section className="px-7 py-12">
      <div className="rounded-[18px] border border-[var(--invite-border)] bg-white/70 px-5 py-6 text-center">
        <span className="inline-flex rounded-full bg-[var(--invite-accent)] px-4 py-1.5 text-[11px] font-medium text-white">
          참석 의사 전달
        </span>
        <h2 className="mt-4 text-[16px] font-light text-[var(--invite-text)]">{invitation.rsvp.title}</h2>
        <p className="mx-auto mt-3 max-w-[280px] whitespace-pre-line text-[13px] leading-7 text-[var(--invite-muted)]">{invitation.rsvp.body}</p>
        <button type="button" onClick={() => setIsOpen((value) => !value)} className="mt-5 rounded-full border border-[var(--invite-border)] px-5 py-2 text-[12px] text-[var(--invite-text)]">
          {invitation.rsvp.buttonText}
        </button>

        {isOpen && (
          <div className="mt-5 space-y-2 text-left">
            <input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} placeholder="이름" className="h-10 w-full rounded border border-[var(--invite-border)] px-3 text-[13px]" />
            <input value={form.phone_last4} onChange={(e) => setForm({ ...form, phone_last4: e.target.value })} placeholder="연락처 뒤 4자리" className="h-10 w-full rounded border border-[var(--invite-border)] px-3 text-[13px]" />
            <div className="flex gap-3 text-[12px] text-[var(--invite-muted)]">
              <label><input type="radio" checked={form.attending} onChange={() => setForm({ ...form, attending: true })} /> 참석</label>
              <label><input type="radio" checked={!form.attending} onChange={() => setForm({ ...form, attending: false })} /> 불참</label>
              <label><input type="checkbox" checked={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.checked })} /> 식사</label>
            </div>
            <input type="number" min={0} value={form.companions} onChange={(e) => setForm({ ...form, companions: Number(e.target.value) })} placeholder="동행인 수" className="h-10 w-full rounded border border-[var(--invite-border)] px-3 text-[13px]" />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="전달사항" rows={3} className="w-full rounded border border-[var(--invite-border)] px-3 py-2 text-[13px]" />
            <button type="button" onClick={submit} className="h-10 w-full rounded-full bg-[var(--invite-accent)] text-[13px] text-white">전달하기</button>
            {message && <p className="text-center text-[12px] text-[var(--invite-muted)]">{message}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
