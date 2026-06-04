"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "모바일 청첩장", href: "/create" },
  { label: "제작 내역", href: "/history" },
];

export default function AppHeader() {
  const pathname = usePathname();

  if (pathname?.startsWith("/i/")) return null;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/create" className="app-brand" aria-label="SAVE THE DATE 홈">
          <span className="app-brand-mark">S</span>
          <span className="app-brand-text">SAVE THE DATE</span>
        </Link>

        <nav className="app-nav" aria-label="주요 메뉴">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`app-nav-link ${active ? "is-active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
