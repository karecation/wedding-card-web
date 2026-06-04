"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getImageSrc } from "@/lib/invitation/getImageSrc";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: { src: string; caption?: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrent((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrent((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  const item = images[current];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* prev */}
      {current > 0 && (
        <button
          type="button"
          aria-label="이전 사진"
          onClick={(e) => { e.stopPropagation(); setCurrent((i) => i - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40"
        >
          ‹
        </button>
      )}
      <div className="max-h-[90dvh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.caption ?? `갤러리 ${current + 1}`}
          className="max-h-[85dvh] max-w-[90vw] rounded-[6px] object-contain shadow-2xl"
        />
        {item.caption && (
          <p className="mt-2 text-center text-[12px] text-white/80">{item.caption}</p>
        )}
        <p className="mt-1 text-center text-[11px] text-white/50">
          {current + 1} / {images.length}
        </p>
      </div>
      {/* next */}
      {current < images.length - 1 && (
        <button
          type="button"
          aria-label="다음 사진"
          onClick={(e) => { e.stopPropagation(); setCurrent((i) => i + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/40"
        >
          ›
        </button>
      )}
      {/* close */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Slide (scroll-snap carousel with dots) ──────────────────────────────────

function SlideGallery({
  items,
  onImageClick,
}: {
  items: { src: string; caption?: string; id: string }[];
  onImageClick: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.max(0, Math.min(items.length - 1, index)));
  }, [items.length]);

  return (
    <div className="relative mt-8">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onImageClick(index)}
            aria-label={`사진 ${index + 1} 크게 보기`}
            className="w-full shrink-0 snap-center overflow-hidden rounded-[10px] bg-[#e8e5e1]"
            style={{ minWidth: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.caption ?? `갤러리 ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="h-[320px] w-full object-cover"
            />
            {item.caption && (
              <figcaption className="px-3 py-2 text-center text-[11px] text-[var(--invite-muted)]">
                {item.caption}
              </figcaption>
            )}
          </button>
        ))}
      </div>
      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번째 사진`}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
                setActiveIndex(i);
              }}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? "h-2 w-5 bg-[var(--invite-accent)]"
                  : "size-2 bg-[var(--invite-border)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 바둑판 (uniform square grid) ────────────────────────────────────────────

function SquareGridGallery({
  items,
  onImageClick,
}: {
  items: { src: string; caption?: string; id: string }[];
  onImageClick: (index: number) => void;
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onImageClick(index)}
          aria-label={`사진 ${index + 1} 크게 보기`}
          className="group relative aspect-square overflow-hidden rounded-[10px] bg-[#e8e5e1]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.caption ?? `갤러리 ${index + 1}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.caption && (
            <span className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {item.caption}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── 그리드 (masonry / collage — natural aspect ratios) ──────────────────────

function MasonryGallery({
  items,
  onImageClick,
}: {
  items: { src: string; caption?: string; id: string }[];
  onImageClick: (index: number) => void;
}) {
  return (
    <div className="mt-8 columns-2 gap-2 [column-fill:_balance]">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onImageClick(index)}
          aria-label={`사진 ${index + 1} 크게 보기`}
          className="group mb-2 block w-full break-inside-avoid overflow-hidden rounded-[10px] bg-[#e8e5e1]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.caption ?? `갤러리 ${index + 1}`}
            loading="lazy"
            decoding="async"
            className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {item.caption && (
            <p className="px-2 py-1.5 text-center text-[10px] text-[var(--invite-muted)]">{item.caption}</p>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GallerySection({
  invitation,
  mode,
}: {
  invitation: NormalizedInvitation;
  mode: "preview" | "public";
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const dedupedImages = (invitation.gallery.images ?? []).filter((image, index, source) => {
    const key = image.id || getImageSrc(image) || String(index);
    return source.findIndex((item, i) => (item.id || getImageSrc(item) || String(i)) === key) === index;
  });

  const resolvedItems = dedupedImages
    .map((image) => ({ image, src: getImageSrc(image) }))
    .filter((entry) => Boolean(entry.src))
    .map((entry, i) => ({
      id: entry.image.id || `gallery-${i}`,
      src: entry.src,
      caption: entry.image.caption,
    }));

  if (!invitation.gallery.enabled) return null;

  if (resolvedItems.length === 0 && mode === "public") return null;

  const galleryType = invitation.gallery.type || "grid";

  const lightboxImages = resolvedItems.map((item) => ({ src: item.src, caption: item.caption }));

  return (
    <>
      <section className="px-7 py-12">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">GALLERY</p>
          <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.gallery.title}</h2>
          <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
        </div>

        {resolvedItems.length === 0 ? (
          <div className="mt-8 grid h-28 place-items-center rounded-[10px] border border-dashed border-[var(--invite-border)] text-[12px] text-[var(--invite-muted)]">
            갤러리 사진을 업로드하면 이곳에 표시됩니다.
          </div>
        ) : galleryType === "slide" ? (
          <SlideGallery items={resolvedItems} onImageClick={setLightboxIndex} />
        ) : galleryType === "masonry" ? (
          // 바둑판: uniform square grid
          <SquareGridGallery items={resolvedItems} onImageClick={setLightboxIndex} />
        ) : (
          // 그리드: masonry / collage
          <MasonryGallery items={resolvedItems} onImageClick={setLightboxIndex} />
        )}
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
