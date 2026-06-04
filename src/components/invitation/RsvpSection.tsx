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

type RsvpModalForm = {
  side: "groom" | "bride";
  name: string;
  count: string;
  meal: "yes" | "no" | "unknown";
  privacyAgreed: boolean;
};

function segmentedClass(active: boolean) {
  return [
    "h-11 flex-1 rounded-[4px] text-[13px] font-semibold transition",
    active
      ? "bg-[var(--invite-accent)] text-white shadow-[0_6px_16px_rgba(120,80,70,0.16)]"
      : "bg-[#f7f6f5] text-[var(--invite-muted)] hover:bg-white",
  ].join(" ");
}

export default function RsvpSection({
  invitation,
  onSubmit,
}: {
  invitation: NormalizedInvitation;
  onSubmit?: (form: RsvpForm) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RsvpModalForm>({
    side: "groom",
    name: "",
    count: "",
    meal: "unknown",
    privacyAgreed: false,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invitation.rsvp.enabled) return null;

  const count = Number(form.count);
  const canSubmit = form.name.trim() && Number.isInteger(count) && count > 0 && form.meal && form.privacyAgreed;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");

    try {
      await onSubmit?.({
        guest_name: `[${form.side === "groom" ? "신랑측" : "신부측"}] ${form.name.trim()}`,
        phone_last4: "",
        attending: true,
        meal: form.meal === "yes",
        companions: count,
        message: `식사여부: ${form.meal === "yes" ? "예정" : form.meal === "no" ? "안함" : "미정"}`,
      });
      setMessage("참석 의사가 전달되었습니다.");
      setForm({ side: "groom", name: "", count: "", meal: "unknown", privacyAgreed: false });
      window.setTimeout(() => setIsOpen(false), 900);
    } catch (error) {
      console.warn("[RSVP submit failed]", { error });
      setMessage("전달에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="px-7 py-14">
      <div className="relative mx-auto max-w-[330px] rounded-[24px] border border-[var(--invite-border)] bg-[linear-gradient(180deg,rgba(255,255,255,.82),rgba(255,249,246,.72))] px-6 pb-7 pt-10 text-center shadow-[0_12px_30px_rgba(92,62,45,0.06)]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[color-mix(in_srgb,var(--invite-accent)_18%,white)] px-5 py-2 text-[11px] font-semibold tracking-[-0.01em] text-[var(--invite-accent)] shadow-[0_4px_14px_rgba(150,105,92,0.08)]">
          {invitation.rsvp.title || "참석 의사 전달"}
        </div>

        <p className="mx-auto max-w-[250px] whitespace-pre-line text-[13px] leading-7 text-[var(--invite-muted)]">
          {invitation.rsvp.body}
        </p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[var(--invite-border)] bg-white/80 px-6 text-[13px] font-semibold text-[var(--invite-text)] shadow-[0_5px_16px_rgba(100,70,58,0.05)] transition hover:bg-white"
        >
          {invitation.rsvp.buttonText || "참석 의사 전달하기"}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-[360px] rounded-[4px] bg-white p-7 text-left shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="mb-7 flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-[#1f2933]">참석 의사 전달</h3>
              <button type="button" aria-label="닫기" onClick={() => setIsOpen(false)} className="text-2xl leading-none text-[#444]">
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-[78px_1fr] items-center gap-3">
                <span className="text-[14px] text-[#1f2933]">구분</span>
                <div className="grid grid-cols-2 gap-1">
                  <button type="button" className={segmentedClass(form.side === "groom")} onClick={() => setForm({ ...form, side: "groom" })}>
                    신랑측
                  </button>
                  <button type="button" className={segmentedClass(form.side === "bride")} onClick={() => setForm({ ...form, side: "bride" })}>
                    신부측
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[78px_1fr] items-center gap-3">
                <span className="text-[14px] text-[#1f2933]">성함</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="h-11 rounded-[2px] border border-transparent bg-[#f7f7f7] px-3 text-[14px] outline-none transition focus:border-[var(--invite-accent)] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-[78px_1fr] items-center gap-3">
                <span className="text-[14px] text-[#1f2933]">참석인원</span>
                <input
                  inputMode="numeric"
                  value={form.count}
                  placeholder="본인 포함 총 참석인원"
                  onChange={(event) => setForm({ ...form, count: event.target.value.replace(/\D/g, "") })}
                  className="h-11 rounded-[2px] border border-transparent bg-[#f7f7f7] px-3 text-[14px] outline-none transition placeholder:text-[#a0a7ae] focus:border-[var(--invite-accent)] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-[78px_1fr] items-center gap-3">
                <span className="text-[14px] text-[#1f2933]">식사여부</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    ["yes", "예정"],
                    ["no", "안함"],
                    ["unknown", "미정"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={segmentedClass(form.meal === value)}
                      onClick={() => setForm({ ...form, meal: value as RsvpModalForm["meal"] })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-6 flex items-start gap-2 text-[13px] font-semibold text-[#1f2933]">
                <input
                  type="checkbox"
                  checked={form.privacyAgreed}
                  onChange={(event) => setForm({ ...form, privacyAgreed: event.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[var(--invite-accent)]"
                />
                개인정보 수집 및 이용 동의 (필수)
              </label>
              <p className="pl-6 text-[12px] leading-5 text-[#9aa1a8]">항목 : 모든 항목 · 보유기간 : 청첩장 이용 종료 시까지</p>
            </div>

            <button
              type="button"
              disabled={!canSubmit || isSubmitting}
              onClick={submit}
              className="mt-8 h-14 w-full rounded-[3px] bg-[var(--invite-accent)] text-[15px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "전달 중" : "참석 의사 전달하기"}
            </button>
            {message && <p className="mt-3 text-center text-[12px] text-[var(--invite-muted)]">{message}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
