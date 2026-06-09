"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getImageSrc } from "@/lib/invitation/getImageSrc";
import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

// ─── Lightbox ────────────────────────────────────────────────────────────────
//
// Rendered into `document.body` via React portal so that the editor preview
// pane's `overflow: hidden` / `transform` / `border-radius` ancestors cannot
// clip the popup. Uses fixed positioning and `z-index: 9999`.
//
// - Original aspect ratio preserved (`object-fit: contain`).
// - Body scroll is locked while open; previous scroll position is restored on
//   close.
// - ESC closes; arrow keys navigate; touch swipe navigates on mobile.

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
  const [mounted, setMounted] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setCurrent((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setCurrent((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard: ESC closes, left/right navigates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  // Body scroll lock — preserve scroll position then restore on cleanup.
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const item = images[current];
  if (!mounted || typeof document === "undefined") return null;

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || startY === null) return;
    const endTouch = e.changedTouches[0];
    if (!endTouch) return;
    const dx = endTouch.clientX - startX;
    const dy = endTouch.clientY - startY;
    // Treat as horizontal swipe only when |dx| > |dy| and large enough.
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  return createPortal(
    <div
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="갤러리 사진"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* prev */}
      {current > 0 && (
        <button
          type="button"
          aria-label="이전 사진"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-full bg-white/15 p-3 text-2xl leading-none text-white transition hover:bg-white/30 sm:left-6"
        >
          ‹
        </button>
      )}

      <div
        className="relative flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.caption ?? `갤러리 ${current + 1}`}
          className="gallery-lightbox__image"
        />
        {item.caption && (
          <p className="mt-3 max-w-[88vw] text-center text-[12px] leading-5 text-white/85">{item.caption}</p>
        )}
        <p className="mt-2 text-center text-[11px] tracking-[0.18em] text-white/65">
          {current + 1} / {images.length}
        </p>
      </div>

      {/* next */}
      {current < images.length - 1 && (
        <button
          type="button"
          aria-label="다음 사진"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 top-1/2 grid -translate-y-1/2 place-items-center rounded-full bg-white/15 p-3 text-2xl leading-none text-white transition hover:bg-white/30 sm:right-6"
        >
          ›
        </button>
      )}

      {/* close */}
      <button
        type="button"
        aria-label="닫기"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/30 sm:right-6 sm:top-6"
      >
        ✕
      </button>
    </div>,
    document.body,
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
