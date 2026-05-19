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
      <body>{children}</body>
    </html>
  );
}
