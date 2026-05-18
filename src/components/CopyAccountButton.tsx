"use client";

import { useState } from "react";

type CopyAccountButtonProps = {
  label: string;
  account: string;
};

export default function CopyAccountButton({ label, account }: CopyAccountButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copyAccount}
      disabled={!account}
      className="flex w-full items-center justify-between rounded-lg border border-[#e3d5bf] bg-[#fffdf8] px-4 py-3 text-left text-sm text-[#4c433b] transition hover:border-[#b89c6e] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span>
        <span className="block text-xs uppercase tracking-[0.18em] text-[#9a7b4f]">{label}</span>
        <span className="mt-1 block break-all">{account || "계좌번호가 입력되지 않았습니다"}</span>
      </span>
      <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[#756a5c]">
        {copied ? "복사됨" : "복사"}
      </span>
    </button>
  );
}
