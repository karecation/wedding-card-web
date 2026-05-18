import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#2d2926]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-6 py-8 sm:px-10">
        <nav className="flex items-center justify-between text-sm tracking-[0.22em] text-[#756a5c]">
          <span>ATELIER VOW</span>
          <span>모바일 청첩장</span>
        </nav>

        <div className="grid items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.32em] text-[#9a7b4f]">
                감도 높은 셀프 청첩장 제작
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-[#2d2926] sm:text-7xl">
                우리다운 모바일 청첩장을 직접 만들어보세요
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#6f6254]">
                사진을 올리고 예식 정보를 입력하면, 현대적인 감도의 모바일 청첩장 미리보기가 바로 완성됩니다.
              </p>
            </div>

            <Link
              href="/create"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#2d2926] px-7 text-sm font-medium uppercase tracking-[0.18em] text-[#fbf7ef] shadow-[0_18px_45px_rgba(45,41,38,0.18)] transition hover:bg-[#4a4038]"
            >
              청첩장 만들기
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[360px]">
            <div className="rounded-[2rem] border border-[#e5dac9] bg-[#fffdf8] p-4 shadow-[0_30px_90px_rgba(72,57,40,0.16)]">
              <div className="overflow-hidden rounded-[1.55rem] border border-[#eee4d4] bg-[#fbf7ef]">
                <div className="h-72 bg-[linear-gradient(rgba(45,41,38,0.1),rgba(45,41,38,0.25)),url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
                <div className="space-y-5 px-7 py-8 text-center">
                  <p className="text-xs uppercase tracking-[0.34em] text-[#9a7b4f]">
                    Wedding day
                  </p>
                  <div>
                    <p className="text-3xl font-serif text-[#2d2926]">도윤 그리고 서연</p>
                    <p className="mt-2 text-sm text-[#756a5c]">2026년 6월 21일</p>
                  </div>
                  <div className="mx-auto h-px w-16 bg-[#d8c7aa]" />
                  <p className="text-sm leading-7 text-[#756a5c]">
                    절제된 여백과 아트 포스터 감성을 담은 모바일 초대장.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#e8ddcc] pt-6 text-sm text-[#756a5c] sm:grid-cols-3">
          <span>사진 중심 구성</span>
          <span>섹션형 편집</span>
          <span>실시간 미리보기</span>
        </div>
      </section>
    </main>
  );
}
