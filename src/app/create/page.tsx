"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileInvitationPreview from "@/components/MobileInvitationPreview";
import WeddingForm from "@/components/WeddingForm";
import { emptyInvitationData, type InvitationData } from "@/types/invitation";

const storageKey = "mobile-wedding-invitation";
const editorSteps = ["사진", "디자인", "예식 정보", "오시는 길", "계좌", "음악"];

export default function CreatePage() {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData>(emptyInvitationData);
  const [saveState, setSaveState] = useState("임시 저장");

  useEffect(() => {
    const savedInvitation = window.localStorage.getItem(storageKey);
    if (!savedInvitation) return;

    try {
      setInvitation({ ...emptyInvitationData, ...JSON.parse(savedInvitation) });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const handleChange = (nextInvitation: InvitationData) => {
    setInvitation(nextInvitation);
    window.localStorage.setItem(storageKey, JSON.stringify(nextInvitation));
    setSaveState("브라우저 저장됨");
  };

  const handlePreview = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(invitation));
    router.push("/preview");
  };

  return (
    <main className="min-h-screen bg-[#eee7dc] text-[#2d2926]">
      <header className="sticky top-0 z-30 border-b border-[#d8c7aa] bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2d2926]">
              Atelier Vow
            </Link>
            <span className="hidden h-5 w-px bg-[#d8c7aa] sm:block" />
            <span className="hidden text-sm text-[#756a5c] sm:inline">모바일 청첩장 웹 에디터</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#d8c7aa] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#756a5c] sm:inline-flex">
              {saveState}
            </span>
            <button
              type="button"
              onClick={handlePreview}
              className="min-h-10 rounded-full bg-[#2d2926] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#fbf7ef] transition hover:bg-[#4a4038]"
            >
              크게 보기
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] gap-0 lg:grid-cols-[220px_minmax(0,1fr)_460px]">
        <aside className="hidden border-r border-[#d8c7aa] bg-[#f7efe3] px-5 py-6 lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#9a7b4f]">Editor</p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight">청첩장 만들기</h1>
            </div>
            <nav className="space-y-2">
              {editorSteps.map((step, index) => (
                <a
                  key={step}
                  href={`#step-${index + 1}`}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-[#5f554b] transition hover:bg-[#fffaf2]"
                >
                  <span className="grid size-7 place-items-center rounded-full border border-[#c9b895] text-xs">
                    {index + 1}
                  </span>
                  {step}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-lg border border-[#d8c7aa] bg-[#fbf7ef] p-5 shadow-[0_18px_60px_rgba(72,57,40,0.08)] sm:p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-[#9a7b4f]">Project setup</p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold leading-tight">예식 정보를 입력해 주세요</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f6254]">
                    왼쪽 단계에 따라 입력하면 오른쪽 모바일 화면에 실시간으로 반영됩니다.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#eadfce] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#6f6254]">
                  {invitation.templateMood}
                </span>
              </div>
            </div>

            <WeddingForm data={invitation} onChange={handleChange} onPreview={handlePreview} />
          </div>
        </section>

        <aside className="border-t border-[#d8c7aa] bg-[#e8ddcc] px-4 py-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-6">
          <div className="mx-auto max-w-[430px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#8b6c41]">Live preview</p>
                <p className="mt-1 text-sm text-[#6f6254]">모바일 청첩장 화면</p>
              </div>
              <Link
                href="/preview"
                onClick={() => window.localStorage.setItem(storageKey, JSON.stringify(invitation))}
                className="rounded-full border border-[#bda984] px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#4c433b] transition hover:bg-[#fbf7ef]"
              >
                열기
              </Link>
            </div>
            <MobileInvitationPreview data={invitation} compact />
          </div>
        </aside>
      </div>
    </main>
  );
}
