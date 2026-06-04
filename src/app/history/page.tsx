"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { deleteInvitationAction, listInvitationHistoryAction, type InvitationHistoryItem } from "@/app/actions/invitationActions";
import { deleteLocalInvitation, getWeddingSessionId, listLocalInvitationSummaries, type LocalInvitationSummary } from "@/lib/localInvitations";

function toHistoryItem(invitation: LocalInvitationSummary): InvitationHistoryItem {
  return {
    id: invitation.id,
    slug: invitation.slug,
    groomName: invitation.groomName || "신랑",
    brideName: invitation.brideName || "신부",
    weddingDate: invitation.weddingDate,
    weddingTime: invitation.weddingTime,
    venueName: invitation.venueName,
    hallName: invitation.hallName,
    updatedAt: invitation.updatedAt,
    isPublished: invitation.isPublished,
  };
}

function mergeHistoryItems(remote: InvitationHistoryItem[], local: InvitationHistoryItem[]) {
  const seen = new Set<string>();
  return [...remote, ...local]
    .filter((item) => {
      const key = item.id || item.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

function formatDate(dateText: string) {
  if (!dateText) return "예식일 미입력";
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatUpdatedAt(dateText: string) {
  if (!dateText) return "-";
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/\s/g, "");
}

function getCoupleName(item: InvitationHistoryItem) {
  return `${item.groomName || "신랑"} ♥ ${item.brideName || "신부"}`;
}

function getVenueLine(item: InvitationHistoryItem) {
  const venue = [item.venueName, item.hallName].filter(Boolean).join(" ");
  return venue || "예식장 정보 미입력";
}

export default function HistoryPage() {
  const [items, setItems] = useState<InvitationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async (item: InvitationHistoryItem) => {
    const ok = window.confirm("이 청첩장을 삭제할까요? 삭제 후에는 복구할 수 없습니다.");
    if (!ok) return;

    deleteLocalInvitation(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id && entry.slug !== item.slug));

    const result = await deleteInvitationAction(item.id);
    if (!result.ok) console.warn("[History delete DB failed]", { id: item.id, error: result.error });
  };

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      console.log("[History load start]");
      setIsLoading(true);
      setErrorMessage("");

      const localInvitations = listLocalInvitationSummaries().map(toHistoryItem);
      if (localInvitations.length > 0) {
        setItems(localInvitations);
        console.log("[HISTORY] invitations:", localInvitations);
      }

      try {
        const remoteInvitations = await listInvitationHistoryAction(getWeddingSessionId());
        if (!active) return;
        const invitations = mergeHistoryItems(remoteInvitations, localInvitations);
        setItems(invitations);
        console.log("[History invitations loaded]", { count: invitations.length });
        console.log("[HISTORY] invitations:", invitations);
      } catch (error) {
        if (!active) return;
        if (localInvitations.length === 0) {
          const message = error instanceof Error ? error.message : "제작 내역을 불러오지 못했습니다.";
          setErrorMessage(message);
          console.warn("[History load failed]", { error: message });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-[calc(100dvh-68px)] bg-[radial-gradient(circle_at_top_left,rgba(209,137,116,0.16),transparent_32%),linear-gradient(135deg,#fffaf3_0%,#f8efe5_52%,#fffdf9_100%)] px-5 py-10 text-[#2f2a26] sm:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-5 border-b border-[#eadbd0] pb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c78372]">Saved Invitations</p>
            <h1 className="font-serif text-3xl font-semibold text-[#2f2a26] sm:text-4xl">제작 내역</h1>
            <p className="mt-3 text-sm leading-6 text-[#756962] sm:text-base">
              저장한 모바일 청첩장을 확인하고 다시 수정하거나 미리볼 수 있습니다.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#bf7665] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(191,118,101,0.22)] transition hover:-translate-y-0.5 hover:bg-[#a96355]"
          >
            모바일 청첩장 만들기
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-[8px] border border-[#eadbd0] bg-white/82 p-6 shadow-[0_18px_45px_rgba(76,55,43,0.08)]">
            <p className="text-sm font-semibold text-[#2f2a26]">제작 내역을 불러오지 못했습니다.</p>
            <p className="mt-2 text-sm text-[#756962]">{errorMessage}</p>
          </div>
        ) : null}

        {isLoading && items.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-[8px] border border-[#eadbd0] bg-white/70" />
            ))}
          </div>
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-[#eadbd0] bg-white/84 px-6 py-12 text-center shadow-[0_18px_45px_rgba(76,55,43,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#c78372]">Empty</p>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-[#2f2a26]">아직 제작한 모바일 청첩장이 없습니다.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#756962]">
              첫 청첩장을 저장하면 이곳에서 미리보기와 수정 링크를 다시 확인할 수 있습니다.
            </p>
            <Link
              href="/create"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-[8px] bg-[#bf7665] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(191,118,101,0.22)] transition hover:-translate-y-0.5 hover:bg-[#a96355]"
            >
              모바일 청첩장 만들기
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const previewHref = `/preview/${item.id}`;
              const editHref = `/create?editId=${item.id}`;

              return (
                <article
                  key={item.id}
                  className="group relative flex min-h-64 flex-col justify-between rounded-[8px] border border-[#eadbd0] bg-white/86 p-5 shadow-[0_18px_45px_rgba(76,55,43,0.08)] transition hover:-translate-y-1 hover:border-[#d8b9aa] hover:shadow-[0_22px_55px_rgba(76,55,43,0.12)]"
                >
                  <button
                    type="button"
                    aria-label="청첩장 삭제"
                    onClick={() => handleDelete(item)}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-[#eadbd0] bg-white text-sm font-semibold text-[#a96355] transition hover:bg-[#fff7ef]"
                  >
                    ×
                  </button>
                  <div>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c78372]">Mobile Invitation</p>
                        <h2 className="mt-2 font-serif text-2xl font-semibold text-[#2f2a26]">{getCoupleName(item)}</h2>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#eadbd0] bg-[#fff7ef] px-3 py-1 text-[11px] font-semibold text-[#a96355]">
                        {item.isPublished ? "미리보기 저장됨" : "제작 중"}
                      </span>
                    </div>

                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a99b92]">Date</dt>
                        <dd className="mt-1 text-[#4a4039]">
                          {formatDate(item.weddingDate)}
                          {item.weddingTime ? ` ${item.weddingTime}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a99b92]">Venue</dt>
                        <dd className="mt-1 text-[#4a4039]">{getVenueLine(item)}</dd>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-[#f0e4da] pt-3">
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a99b92]">Code</dt>
                          <dd className="mt-1 truncate text-xs text-[#756962]">{item.slug || item.id}</dd>
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a99b92]">Updated</dt>
                          <dd className="mt-1 text-xs text-[#756962]">{formatUpdatedAt(item.updatedAt)}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Link
                      href={previewHref}
                      onClick={() => console.log("[History preview click]", { id: item.id, slug: item.slug })}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] border border-[#d8b9aa] bg-white text-sm font-semibold text-[#9f5e51] transition hover:bg-[#fff7ef]"
                    >
                      미리보기
                    </Link>
                    <Link
                      href={editHref}
                      onClick={() => console.log("[History edit click]", { id: item.id, slug: item.slug })}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-[8px] bg-[#2f2a26] text-sm font-semibold text-white transition hover:bg-[#4a4039]"
                    >
                      수정하기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
