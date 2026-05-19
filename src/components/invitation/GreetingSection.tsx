"use client";

import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export default function GreetingSection({ invitation }: { invitation: NormalizedInvitation }) {
  const hasContact = Boolean(invitation.contacts.groomPhone || invitation.contacts.bridePhone);

  return (
    <section className="px-7 py-12 text-center">
      <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">{invitation.greeting.label}</p>
      <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.greeting.title}</h2>
      <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      <p className="mx-auto mt-8 max-w-[310px] whitespace-pre-line text-[14px] leading-[2.05] tracking-[-0.01em] text-[var(--invite-muted)]">
        {invitation.greeting.body}
      </p>
      <p className="mt-9 text-[13px] text-[var(--invite-muted)]">
        신랑 {invitation.basic.groomName} · 신부 {invitation.basic.brideName}
      </p>
      {hasContact && (
        <div className="mt-6 flex justify-center gap-2">
          {invitation.contacts.groomPhone && (
            <a href={`tel:${invitation.contacts.groomPhone}`} className="rounded-full border border-[var(--invite-border)] px-4 py-2 text-[12px] text-[var(--invite-text)]">
              신랑에게 연락
            </a>
          )}
          {invitation.contacts.bridePhone && (
            <a href={`tel:${invitation.contacts.bridePhone}`} className="rounded-full border border-[var(--invite-border)] px-4 py-2 text-[12px] text-[var(--invite-text)]">
              신부에게 연락
            </a>
          )}
        </div>
      )}
    </section>
  );
}
