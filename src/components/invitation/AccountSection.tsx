"use client";

import { useState } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export default function AccountSection({ invitation }: { invitation: NormalizedInvitation }) {
  const [copied, setCopied] = useState("");
  if (!invitation.accounts.enabled) return null;

  const accounts = invitation.accounts.groups.filter((group) => !group.hidden && (group.accountNumber || group.bankName || group.accountHolder));
  if (accounts.length === 0) return null;

  const copy = async (text: string, id: string) => {
    await navigator.clipboard?.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1600);
  };

  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">ACCOUNT</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.accounts.title}</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>

      <div className="mt-8 space-y-3">
        {accounts.map((account) => {
          const text = `${account.bankName} ${account.accountNumber} ${account.accountHolder}`.trim();
          return (
            <div key={account.id} className="rounded-[14px] border border-[var(--invite-border)] bg-white/60 px-4 py-4">
              <p className="text-[13px] font-medium text-[var(--invite-text)]">{account.groupName}</p>
              <p className="mt-2 text-[12px] leading-6 text-[var(--invite-muted)]">
                {account.bankName} {account.accountNumber}
                <br />
                {account.accountHolder}
              </p>
              <button type="button" onClick={() => copy(text, account.id)} className="mt-3 rounded-full bg-[var(--invite-accent)] px-4 py-1.5 text-[11px] text-white">
                {copied === account.id ? "복사됨" : "계좌 복사"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
