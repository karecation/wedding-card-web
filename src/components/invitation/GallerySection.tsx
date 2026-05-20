"use client";

import type { NormalizedInvitation } from "@/lib/invitation/normalizeInvitation";

export default function GallerySection({
  invitation,
  mode,
}: {
  invitation: NormalizedInvitation;
  mode: "preview" | "public";
}) {
  const images = (invitation.gallery.images ?? []).filter((image, index, source) => {
    const key = image.id || image.url || image.dataUrl || image.previewUrl || String(index);
    return source.findIndex((item, itemIndex) => (item.id || item.url || item.dataUrl || item.previewUrl || String(itemIndex)) === key) === index;
  });
  if (!invitation.gallery.enabled) return null;
  if (images.length === 0 && mode === "public") return null;
  if (images.length === 0) {
    return (
      <section className="px-7 py-12">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">GALLERY</p>
          <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.gallery.title}</h2>
        </div>
        <div className="mt-8 grid h-28 place-items-center rounded-[10px] border border-dashed border-[var(--invite-border)] text-[12px] text-[var(--invite-muted)]">
          갤러리 사진을 업로드하면 이곳에 표시됩니다.
        </div>
      </section>
    );
  }

  const galleryType = invitation.gallery.type || "grid";
  const renderImage = (image: (typeof images)[number], index: number, className = "") => {
    const src = image.url || image.dataUrl || image.previewUrl;
    if (!src) return null;

    return (
      <figure key={`${image.id || src}-${index}`} className={`overflow-hidden rounded-[10px] bg-[#eee] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={image.caption || `갤러리 사진 ${index + 1}`} loading="lazy" className="h-full w-full object-cover" />
        {image.caption && <figcaption className="px-2 py-1.5 text-center text-[11px] text-[var(--invite-muted)]">{image.caption}</figcaption>}
      </figure>
    );
  };

  return (
    <section className="px-7 py-12">
      <div className="text-center">
        <p className="text-[10px] tracking-[0.34em] text-[var(--invite-accent-soft)]">GALLERY</p>
        <h2 className="mt-2 text-[16px] font-light text-[var(--invite-text)]">{invitation.gallery.title}</h2>
        <div className="mx-auto mt-3 h-px w-8 bg-[var(--invite-border)]" />
      </div>

      {galleryType === "slide" ? (
        <div className="relative mt-8">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => renderImage(image, index, "h-[250px] w-[82%] shrink-0 snap-center"))}
          </div>
          {invitation.gallery.showArrows && images.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 text-[22px] text-white/80">
              <span>‹</span>
              <span>›</span>
            </div>
          )}
        </div>
      ) : galleryType === "masonry" ? (
        <div className="mt-8 columns-2 gap-2 [column-fill:_balance]">
          {images.map((image, index) => renderImage(image, index, `mb-2 break-inside-avoid ${index % 3 === 0 ? "h-[210px]" : "h-[150px]"}`))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-2">
          {images.map((image, index) => renderImage(image, index, "aspect-square"))}
        </div>
      )}
    </section>
  );
}
