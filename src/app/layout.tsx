import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FROM TODAY 모바일 청첩장",
  description: "한국형 모바일 청첩장 제작 웹사이트",
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
