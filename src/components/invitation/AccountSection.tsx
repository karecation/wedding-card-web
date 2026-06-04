"use client";

import { useState } from "react";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export default function AccountSection({ invitation }: { invitation: NormalizedInvitation }) {
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");
  if (!invitation.accounts.enabled) return null;

  const accounts = invitation.accounts.groups.filter((group) => !group.hidden && (group.accountNumber || group.bankName || group.accountHolder));
  if (accounts.length === 0) return null;

  const copy = async (text: string, id: string) => {
    if (!text.trim()) {
      setMessage("복사할 계좌번호가 없습니다.");
      return;
    }
    await navigator.clipboard?.writeText(text);
    setCopied(id);
    setMessage("계좌번호가 복사되었습니다.");
    window.setTimeout(() => {
      setCopied("");
      setMessage("");
    }, 1600);
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
          const copyText = [account.bankName, account.accountNumber].filter(Boolean).join(" ");
          const canCopy = Boolean(account.accountNumber);
          return (
            <div key={account.id} className="rounded-[14px] border border-[var(--invite-border)] bg-white/60 px-4 py-4">
              <p className="text-[13px] font-medium text-[var(--invite-text)]">{account.groupName}</p>
              <p className="mt-2 text-[12px] leading-6 text-[var(--invite-muted)]">
                {[account.bankName, account.accountNumber].filter(Boolean).join(" ")}
                {account.accountHolder && (
                  <>
                    <br />
                    {account.accountHolder}
                  </>
                )}
              </p>
              <button
                type="button"
                disabled={!canCopy}
                onClick={() => copy(copyText, account.id)}
                className="mt-3 rounded-full bg-[var(--invite-accent)] px-4 py-1.5 text-[11px] text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {copied === account.id ? "복사됨" : "계좌 복사"}
              </button>
            </div>
          );
        })}
      </div>
      {message && <p className="mt-3 text-center text-[12px] text-[var(--invite-muted)]">{message}</p>}
    </section>
  );
}
