import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Save The Date — 모바일 청첩장",
  description: "고급스럽고 미니멀한 한국형 모바일 청첩장 제작 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gowun+Batang&family=Gowun+Dodum&family=Nanum+Myeongjo&family=Noto+Serif+KR:wght@300;400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
