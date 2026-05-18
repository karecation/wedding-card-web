type MapButtonProps = {
  href: string;
};

export default function MapButton({ href }: MapButtonProps) {
  const resolvedHref = href || "#";

  return (
    <a
      href={resolvedHref}
      target={href ? "_blank" : undefined}
      rel={href ? "noreferrer" : undefined}
      aria-disabled={!href}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#2d2926] px-5 text-sm font-medium uppercase tracking-[0.18em] text-[#fbf7ef] transition hover:bg-[#4a4038] aria-disabled:pointer-events-none aria-disabled:opacity-45"
    >
      오시는 길 보기
    </a>
  );
}
