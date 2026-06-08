"use client";

import { useMemo, useRef, useState } from "react";
import { PALETTE_DEFS } from "@/lib/invitation/normalizeInvitation";
import KakaoMap from "@/components/invitation/KakaoMap";
import { searchKakaoLocation, type LocationSearchResult } from "@/lib/kakaoMaps";
import {
  asIntroTemplate,
  getIntroImageSlotPreset,
  getIntroThemeConfig,
  INTRO_LAYOUT_OPTIONS,
  resolveIntroLayout,
} from "@/lib/invitation/introLayouts";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { resizeImageToDataUrl } from "@/lib/images/resizeImage";
import { validateUploadFile, type PendingUpload } from "@/lib/upload";
import type {
  BankAccountItem,
  ContactItem,
  GalleryImage,
  ImageUploadType,
  InvitationData,
  LocationData,
  MenuSectionId,
  TransportItem,
} from "@/types/invitation";

type Props = {
  data: InvitationData;
  isSaving?: boolean;
  onChange: (data: InvitationData) => void;
  onPendingUpload?: (upload: PendingUpload) => void;
};

const sectionSeed = [
  "theme",
  "intro",
  "groom",
  "bride",
  "greeting",
  "datetime",
  "venue",
  "transport",
  "gallery",
  "contacts",
  "accounts",
  "video",
  "music",
  "notice",
  "rsvp",
  "guestbook",
  "quote",
  "kakaoShare",
  "urlShare",
  "menuOrder",
];

const menuLabels: Record<MenuSectionId, string> = {
  intro: "인트로",
  greeting: "모시는 글",
  calendar: "달력",
  gallery: "갤러리",
  video: "동영상",
  location: "오시는 길",
  notice: "안내사항",
  rsvp: "참석의사",
  accounts: "계좌번호",
  guestbook: "방명록",
  quote: "사진 & 글귀",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-4">
      <label className="pt-2 text-[12px] leading-5 text-[#555]">{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full min-w-0 rounded-[6px] border border-[#e8ded5] bg-white px-3 text-[13px] text-[#2b211c] outline-none placeholder:text-[#bcbcbc] focus:border-[#8e7464] ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full min-w-0 rounded-[6px] border border-[#e8ded5] bg-white px-3 py-2 text-[13px] leading-6 text-[#2b211c] outline-none placeholder:text-[#bcbcbc] focus:border-[#8e7464] ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 rounded-[6px] border border-[#e8ded5] bg-white px-3 text-[13px] text-[#2b211c] outline-none focus:border-[#8e7464] ${props.className ?? ""}`}
    />
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-7 cursor-pointer items-center gap-2 text-[12px] text-[#555]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#555]" />
      <span>{label}</span>
    </label>
  );
}

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-[5px] px-3 text-[12px] transition ${
        active ? "border border-[#3A2F2A] bg-white text-[#2b211c]" : "border border-transparent bg-[#f7f3ef] text-[#9b8d84] hover:text-[#5e5048]"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#e6d8cc] bg-white/95 shadow-[0_10px_28px_rgba(58,47,42,0.035)]">
      <button type="button" onClick={onToggle} className="flex h-[54px] w-full items-center justify-between px-5 text-left">
        <span className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded-full bg-[#8E7464] text-[10px] text-white">✓</span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111]">{title}</span>
          {badge && <span className="rounded bg-[#f4f4f4] px-1.5 py-0.5 text-[10px] text-[#999]">{badge}</span>}
        </span>
        <span className="text-[18px] leading-none text-[#555]">{open ? "⌃" : "⌄"}</span>
      </button>
      {open && <div className="space-y-4 border-t border-[#f1ebe6] px-5 py-5">{children}</div>}
    </section>
  );
}

function UploadBox({
  imageUrl,
  type,
  label = "클릭 후 업로드",
  className,
  onSelect,
}: {
  imageUrl: string;
  type: ImageUploadType | "audio";
  label?: string;
  className?: string;
  onSelect: (type: ImageUploadType | "audio", files: FileList | File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isGallery = type === "gallery";
  const openFileDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div
      className={`grid min-h-[146px] w-full max-w-[320px] cursor-pointer place-items-center overflow-hidden rounded-[8px] border border-dashed bg-[#faf7f3] px-4 py-4 text-center text-[12px] transition ${isDragging ? "border-[#3A2F2A] bg-white" : "border-[#ded3c7] text-[#B8896A] hover:border-[#B8896A]"} ${className ?? ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files?.length) onSelect(type, event.dataTransfer.files);
      }}
    >
      <button type="button" onClick={openFileDialog} className="grid h-full min-h-[118px] w-full cursor-pointer place-items-center text-center">
        {imageUrl && type !== "audio" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full rounded-[4px] object-cover" />
        ) : (
          <span className="space-y-1 leading-5">
            <span className="block font-semibold text-[#B8896A]">{isGallery ? "사진을 클릭하거나 여기로 끌어다 놓으세요" : label}</span>
            {isGallery && <span className="block text-[11px] text-[#999]">여러 장을 한 번에 추가할 수 있습니다.</span>}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={type === "audio" ? "audio/mpeg,.mp3" : "image/*"}
        multiple={isGallery}
        hidden
        onChange={(event) => {
          if (event.target.files) onSelect(type, event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-6 text-[#999]">{children}</p>;
}

async function makeImagePreviews(file: File, maxWidth = 1100, quality = 0.72) {
  const previewUrl = URL.createObjectURL(file);
  try {
    const dataUrl = await resizeImageToDataUrl(file, { maxWidth, quality });
    return { previewUrl, dataUrl };
  } catch {
    return { previewUrl, dataUrl: undefined };
  }
}

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGalleryType(value: string): "slide" | "grid" | "masonry" {
  if (value === "slide" || value.includes("슬라이드")) return "slide";
  if (value === "masonry" || value.includes("바둑판")) return "masonry";
  return "grid";
}

function galleryTypeToLabel(value: string) {
  if (normalizeGalleryType(value) === "slide") return "슬라이드";
  if (normalizeGalleryType(value) === "masonry") return "바둑판";
  return "그리드";
}

function labelToGalleryType(label: string): "slide" | "grid" | "masonry" {
  if (label === "슬라이드") return "slide";
  if (label === "바둑판") return "masonry";
  return "grid";
}

const introFrameOptions = [
  { key: "basic", label: "기본" },
  { key: "arch", label: "아치" },
  { key: "oval", label: "타원" },
  { key: "frame", label: "액자" },
  { key: "fill", label: "채우기" },
] as const;

const weddingColorOptions = [
  { id: "pure-white" as const, name: "화이트" },
  { id: "champagne"  as const, name: "샴페인" },
  { id: "rose-gold"  as const, name: "로즈 골드" },
  { id: "sage"       as const, name: "세이지" },
];

// 저장된 themeColor(구 hex/ID 포함) → 현재 paletteId 로 정규화
function getSelectedPaletteId(value: string | null | undefined): string {
  const clean = (value ?? "").trim().toLowerCase();
  if (!clean) return "pure-white";
  if (weddingColorOptions.some((o) => o.id === clean)) return clean;
  const legacy: Record<string, string> = {
    "ivory-warm": "champagne", "blush-rose": "rose-gold", "sage-green": "sage", "slate-blue": "pure-white",
    "coral-sand": "champagne", "champagne-beige": "champagne", "terracotta-clay": "champagne", "graphite-ivory": "pure-white",
    "rose-taupe": "rose-gold", "lavender-mist": "rose-gold", "sage-linen": "sage", "dusty-blue": "pure-white",
    "ivory": "pure-white", "beige": "champagne", "pink": "rose-gold",
    "#b8956a": "champagne", "#a88a5c": "champagne",
    "#bc8f96": "rose-gold", "#b87888": "rose-gold",
    "#7a9e6a": "sage", "#6a9070": "sage",
    "#738fa4": "pure-white", "#bca882": "pure-white",
  };
  return legacy[clean] ?? "pure-white";
}

function normalizeIntroFrameKey(value: string | null | undefined) {
  const clean = value?.trim() ?? "";
  if (clean === "arch" || clean.includes("아치")) return "arch";
  if (clean === "oval" || clean === "ellipse" || clean.includes("타원")) return "oval";
  if (clean === "frame" || clean.includes("액자")) return "frame";
  if (clean === "fill" || clean.includes("채우기")) return "fill";
  return "basic";
}

function orderedGalleryImages(data: InvitationData) {
  const source = data.gallery?.images?.length ? data.gallery.images : data.galleryItems;
  return source
    .map((image, index) => ({
      ...image,
      previewUrl: image.previewUrl || image.url || image.dataUrl || "",
      order: image.order ?? index,
    }))
    .filter((image) => image.previewUrl || image.url)
    .sort((a, b) => a.order - b.order)
    .map((image, index) => ({ ...image, order: index }));
}

export default function KoreanInvitationEditor({ data, onChange, onPendingUpload }: Props) {
  const [openSections, setOpenSections] = useState(sectionSeed);
  const [uploadError, setUploadError] = useState("");
  const [locationSearchMessage, setLocationSearchMessage] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<LocationSearchResult[]>([]);
  // 주소 입력 draft — 검색 버튼 클릭 시에만 lat/lng 확정
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  const [draggedMenuId, setDraggedMenuId] = useState<MenuSectionId | null>(null);
  const [draggedGalleryId, setDraggedGalleryId] = useState<string | null>(null);

  const galleryImages = orderedGalleryImages(data);
  const galleryEnabled = data.menuOrder.find((item) => item.id === "gallery")?.enabled ?? data.gallery?.enabled ?? false;
  // 인트로 테마는 저장/미리보기/수정하기 모두 같은 layout key를 기준으로 동작한다.
  const selectedIntroLayout = resolveIntroLayout(data.introTemplate || data.templateMood);
  const selectedIntroSlot = getIntroImageSlotPreset(selectedIntroLayout);
  const selectedIntroTheme = getIntroThemeConfig(selectedIntroLayout);
  const canCustomizeIntroFrame = selectedIntroLayout === "moment" || selectedIntroLayout === "minimal";
  const selectedIntroFrame = normalizeIntroFrameKey(data.introShape);
  const selectedPaletteId = getSelectedPaletteId(data.themeColor);

  const update = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => onChange({ ...data, [key]: value });
  const patch = (next: Partial<InvitationData>) => onChange({ ...data, ...next });
  const getLocationState = (): LocationData => ({
    title: data.location?.title || data.venueTitle,
    venueName: data.location?.venueName || data.venueName,
    hallName: data.location?.hallName || data.venueHall,
    address: data.location?.address || data.venueAddress,
    detailAddress: data.location?.detailAddress || "",
    lat: data.location?.lat ?? data.latitude ?? undefined,
    lng: data.location?.lng ?? data.longitude ?? undefined,
    transportTitle: data.location?.transportTitle || data.transports[0]?.title || "",
    transportDescription: data.location?.transportDescription || data.transports[0]?.description || "",
  });
  const locationState = getLocationState();
  const hasEditorMapTarget = typeof locationState.lat === "number" && typeof locationState.lng === "number";
  const updateLocation = <K extends keyof LocationData>(field: K, value: LocationData[K]) => {
    const nextLocation = { ...getLocationState(), [field]: value };
    const nextData: Partial<InvitationData> = { location: nextLocation };

    if (field === "title") nextData.venueTitle = String(value ?? "");
    if (field === "venueName") nextData.venueName = String(value ?? "");
    if (field === "hallName") nextData.venueHall = String(value ?? "");
    if (field === "address") {
      nextLocation.lat = undefined;
      nextLocation.lng = undefined;
      nextData.venueAddress = String(value ?? "");
      nextData.latitude = null;
      nextData.longitude = null;
    }
    if (field === "lat") nextData.latitude = typeof value === "number" ? value : null;
    if (field === "lng") nextData.longitude = typeof value === "number" ? value : null;

    patch(nextData);
  };
  /** 검색 결과를 선택해서 location에 commit */
  const commitLocationResult = (result: LocationSearchResult) => {
    const address = result.roadAddress || result.jibunAddress || result.placeName;
    const nextLocation = {
      ...getLocationState(),
      address,
      lat: result.lat,
      lng: result.lng,
    };
    patch({
      location: nextLocation,
      venueAddress: address,
      latitude: result.lat,
      longitude: result.lng,
    });
    // draft 초기화 & 결과 목록 닫기
    setAddressDraft(null);
    setLocationSearchResults([]);
    setLocationSearchMessage(result.placeName ? `"${result.placeName}" 위치를 지도에 표시했습니다.` : "검색한 위치를 지도에 표시했습니다.");
  };

  const searchLocationAddress = async () => {
    const query = (addressDraft ?? getLocationState().address ?? "").trim();
    if (!query) {
      setLocationSearchMessage("주소를 입력 후 [검색]을 눌러주세요.");
      return;
    }

    setIsSearchingLocation(true);
    setLocationSearchResults([]);
    setLocationSearchMessage("검색 중입니다…");

    try {
      const searchResult = await searchKakaoLocation(query);

      if (searchResult.single) {
        // draft에 입력된 주소 텍스트를 실제 location.address에 반영
        if (addressDraft !== null) {
          updateLocation("address", query);
        }
        commitLocationResult(searchResult.single);
      } else if (searchResult.multiple && searchResult.multiple.length > 0) {
        // 여러 결과 → 목록 표시
        setLocationSearchResults(searchResult.multiple);
        setLocationSearchMessage("아래 결과 중 하나를 선택하세요.");
      }
    } catch (error) {
      setLocationSearchMessage(error instanceof Error ? error.message : "주소 검색에 실패했습니다.");
    } finally {
      setIsSearchingLocation(false);
    }
  };
  const updateIntroTheme = (themeValue: string) => {
    const layout = resolveIntroLayout(themeValue);
    const preset = getIntroThemeConfig(layout);
    patch({
      templateMood: layout,
      introTemplate: asIntroTemplate(layout),
      themeColor: preset.themeColor,
      fontFamily: preset.fontFamily,
      fontWeight: preset.fontWeight,
    });
  };
  const toggle = (id: string) => setOpenSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const sectionProps = (id: string) => ({ open: openSections.includes(id), onToggle: () => toggle(id) });

  const syncGallery = (images: GalleryImage[], extra?: Partial<InvitationData>) => {
    const orderedImages = images.map((image, index) => ({ ...image, order: index }));
    const nextGalleryTitle = extra?.galleryTitle ?? data.galleryTitle;
    const nextGalleryType = normalizeGalleryType(String(extra?.galleryType ?? data.gallery?.type ?? data.galleryType ?? "grid"));
    const nextShowArrows = extra?.showGalleryArrows ?? data.gallery?.showArrows ?? data.showGalleryArrows;
    const explicitlyEnabled = extra?.menuOrder?.find((item) => item.id === "gallery")?.enabled;
    const nextEnabled = explicitlyEnabled ?? (galleryEnabled || orderedImages.length > 0);

    patch({
      ...extra,
      galleryTitle: nextGalleryTitle,
      galleryType: nextGalleryType,
      showGalleryArrows: nextShowArrows,
      gallery: {
        enabled: nextEnabled,
        title: nextGalleryTitle,
        type: nextGalleryType,
        showArrows: nextShowArrows,
        images: orderedImages,
      },
      galleryItems: orderedImages,
      galleryImages: orderedImages.map((image) => image.url || image.dataUrl || image.previewUrl || "").filter(Boolean),
      menuOrder:
        extra?.menuOrder ??
        data.menuOrder.map((menu) => (menu.id === "gallery" ? { ...menu, enabled: nextEnabled } : menu)),
    });
  };

  const selectFiles = async (type: ImageUploadType | "audio", files: FileList | File[]) => {
    setUploadError("");

    const incomingFiles = Array.from(files)
      .filter((file) => (type === "audio" ? true : file.type.startsWith("image/")))
      .slice(0, type === "gallery" ? Math.max(0, 60 - galleryImages.length) : 1);

    const nextGalleryItems: GalleryImage[] = [];

    for (const file of incomingFiles) {
      const error = validateUploadFile(file, type);
      if (error) {
        console.warn("[Gallery file rejected]", { name: file.name, type: file.type, size: file.size, reason: error });
        setUploadError(error);
        continue;
      }

      try {
        const id = createClientId(type);
        // 갤러리는 더 작게 압축 (저장공간 절약)
        const preview = type === "audio"
          ? { previewUrl: URL.createObjectURL(file), dataUrl: "" }
          : type === "gallery"
          ? await makeImagePreviews(file, 800, 0.65)
          : await makeImagePreviews(file);
        const { previewUrl, dataUrl } = preview;
        onPendingUpload?.({ id, type, file, previewUrl, dataUrl });

        // dataUrl(base64)은 세션 종료 후에도 localStorage에 유지된다.
        // previewUrl(blob)은 현재 세션에서 빠른 표시용으로만 사용.
        const persistUrl = dataUrl || previewUrl;
        if (type === "main") patch({ coverImage: persistUrl, introImage: persistUrl });
        if (type === "intro") patch({ introImage: persistUrl, coverImage: persistUrl });
        if (type === "quote" || type === "photoQuote" || type === "photo-quote") update("quoteImage", persistUrl);
        if (type === "kakao_thumbnail" || type === "kakaoThumbnail") update("kakaoThumbnailUrl", persistUrl);
        if (type === "url_thumbnail" || type === "urlThumbnail" || type === "shareThumbnail" || type === "share") update("urlThumbnailUrl", persistUrl);
        if (type === "audio") patch({ audioUrl: previewUrl, musicUrl: previewUrl, audioTitle: file.name });
        if (type === "gallery") {
          nextGalleryItems.push({
            id,
            file,
            url: dataUrl || "",  // base64를 url로 저장 — sanitize 후에도 유지됨
            previewUrl,
            dataUrl,
            caption: "",
            order: galleryImages.length + nextGalleryItems.length,
            type: "gallery",
          });
        }
      } catch (err) {
        console.error("[Gallery file processing failed]", {
          name: file.name,
          type: file.type,
          size: file.size,
          error: err instanceof Error ? err.message : String(err),
        });
        setUploadError(`${file.name} 처리에 실패했습니다. 다른 형식의 사진을 사용해 주세요.`);
      }
    }

    if (type === "gallery" && nextGalleryItems.length > 0) {
      syncGallery([...galleryImages, ...nextGalleryItems].slice(0, 60));
    } else if (type === "gallery") {
      console.warn("[Gallery sync skipped]", { reason: "no items processed", incomingCount: incomingFiles.length });
    }
  };

  const setMenuEnabled = (id: MenuSectionId, enabled: boolean) => {
    const nextMenu = data.menuOrder.map((item) => (item.id === id ? { ...item, enabled } : item));
    if (id === "gallery") syncGallery(galleryImages, { menuOrder: nextMenu });
    else update("menuOrder", nextMenu);
  };

  const moveMenu = (targetId: MenuSectionId) => {
    if (!draggedMenuId || draggedMenuId === targetId) return;
    const next = [...data.menuOrder];
    const from = next.findIndex((item) => item.id === draggedMenuId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update("menuOrder", next);
  };

  const moveMenuByIndex = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= data.menuOrder.length) return;
    const next = [...data.menuOrder];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    update("menuOrder", next);
  };

  const moveGallery = (targetId: string) => {
    if (!draggedGalleryId || draggedGalleryId === targetId) return;
    const next = [...galleryImages];
    const from = next.findIndex((item) => item.id === draggedGalleryId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    syncGallery(next);
  };

  const moveGalleryByIndex = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return;
    const next = [...galleryImages];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    syncGallery(next);
  };

  const removeGalleryImage = (imageId: string) => {
    const image = galleryImages.find((item) => item.id === imageId);
    if (image?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
    const nextImages = galleryImages.filter((item) => item.id !== imageId);
    syncGallery(nextImages, {
      menuOrder: nextImages.length === 0 ? data.menuOrder.map((menu) => (menu.id === "gallery" ? { ...menu, enabled: false } : menu)) : data.menuOrder,
    });
  };

  const setGroomName = (last: string, first: string) => patch({ groomLastName: last, groomFirstName: first, groomName: `${last}${first}` });
  const setBrideName = (last: string, first: string) => patch({ brideLastName: last, brideFirstName: first, brideName: `${last}${first}` });
  const updateTransport = (id: string, item: Partial<TransportItem>) => {
    const nextTransports = data.transports.map((transport) => (transport.id === id ? { ...transport, ...item } : transport));
    const firstTransport = nextTransports[0];
    patch({
      transports: nextTransports,
      location: {
        ...getLocationState(),
        transportTitle: firstTransport?.title || "",
        transportDescription: firstTransport?.description || "",
      },
    });
  };
  const updateContact = (id: string, item: Partial<ContactItem>) => update("contacts", data.contacts.map((contact) => (contact.id === id ? { ...contact, ...item } : contact)));
  const updateAccount = (id: string, item: Partial<BankAccountItem>) => update("bankAccounts", data.bankAccounts.map((account) => (account.id === id ? { ...account, ...item } : account)));
  const youtubePreviewId = useMemo(() => extractYouTubeVideoId(data.youtubeUrl), [data.youtubeUrl]);

  return (
    <div
      className="space-y-4"
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        if (event.dataTransfer.files?.length) event.preventDefault();
      }}
    >
      {uploadError && <div className="border border-[#f4c7bd] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#d8563d]">{uploadError}</div>}

      <Section title="테마" {...sectionProps("theme")}>
        <Field label="테마">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedIntroLayout}
              onChange={(event) => updateIntroTheme(event.target.value)}
              className="h-10 w-[170px] border-[#111] text-[14px] font-medium"
            >
              {INTRO_LAYOUT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.selectLabel}
                </option>
              ))}
            </Select>
            <span className="text-[11px] leading-5 text-[#999]">{selectedIntroTheme.mood}</span>
          </div>
        </Field>
        <Field label="컬러">
          <div className="flex gap-3">
            {weddingColorOptions.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                aria-label={name}
                title={name}
                onClick={() => update("themeColor", id)}
                className={`size-8 rounded-full overflow-hidden transition hover:scale-110 focus:outline-none ${
                  selectedPaletteId === id
                    ? "ring-2 ring-offset-2 ring-offset-white ring-[#2b211c] scale-110 shadow-sm"
                    : "ring-1 ring-[#e0d6d0] hover:ring-[#b0a8a4]"
                }`}
                style={{
                  background: `linear-gradient(to bottom, ${PALETTE_DEFS[id].bg} 50%, ${PALETTE_DEFS[id].accent} 50%)`,
                }}
              />
            ))}
          </div>
        </Field>
        <Field label="글꼴">
          <div className="flex flex-wrap gap-2">
            <Select value={data.fontFamily} onChange={(event) => update("fontFamily", event.target.value)} className="w-[150px]">
              <option value="gowun-dodum">고운고딕</option>
              <option value="gowun-batang">고운바탕</option>
              <option value="noto-serif">노토세리프</option>
              <option value="pretendard">프리텐다드</option>
              <option value="nanum-myeongjo">나눔명조</option>
            </Select>
            <Select value={data.fontWeight} onChange={(event) => update("fontWeight", event.target.value)} className="w-[120px]">
              <option value="light">얇게</option>
              <option value="regular">보통</option>
              <option value="medium">굵게</option>
            </Select>
          </div>
        </Field>
        <Field label="옵션">
          <div className="space-y-1">
            <Checkbox label="청첩장 확대 방지" checked={data.preventZoom} onChange={(value) => update("preventZoom", value)} />
            <Checkbox label="스크롤 시 등장 효과" checked={data.scrollEffect} onChange={(value) => update("scrollEffect", value)} />
          </div>
        </Field>
      </Section>

      <Section title="인트로" {...sectionProps("intro")}>
        <Field label="대표 사진">
          <UploadBox
            imageUrl={data.coverImage || data.introImage}
            type="main"
            onSelect={selectFiles}
            className={selectedIntroSlot.editorFrameClassName}
          />
        </Field>
        {canCustomizeIntroFrame && (
          <Field label="프레임">
            <div className="flex flex-wrap gap-2">
              {introFrameOptions.map((shape) => (
                <Chip
                  key={shape.key}
                  active={selectedIntroFrame === shape.key}
                  onClick={() => update("introShape", shape.key)}
                >
                  {shape.label}
                </Chip>
              ))}
            </div>
          </Field>
        )}
        <Field label="문구">
          <div className="space-y-2">
            <Input value={data.introHeadline} onChange={(event) => update("introHeadline", event.target.value)} placeholder="We're getting married" />
            <Input value={data.introSubText} onChange={(event) => update("introSubText", event.target.value)} placeholder="Save The Date" />
          </div>
        </Field>
      </Section>

      <Section title="신랑측 정보" {...sectionProps("groom")}>
        <Field label="신랑님">
          <div className="flex gap-2">
            <Input value={data.groomLastName} onChange={(event) => setGroomName(event.target.value, data.groomFirstName)} placeholder="성" className="w-[70px]" />
            <Input value={data.groomFirstName} onChange={(event) => setGroomName(data.groomLastName, event.target.value)} placeholder="이름" className="w-[100px]" />
            <Select value={data.groomRelation} onChange={(event) => update("groomRelation", event.target.value)}><option>아들</option><option>장남</option><option>차남</option></Select>
          </div>
        </Field>
        <Help>아버님·어머님 성함은 생략할 수 있습니다.</Help>
      </Section>

      <Section title="신부측 정보" {...sectionProps("bride")}>
        <Field label="신부님">
          <div className="flex gap-2">
            <Input value={data.brideLastName} onChange={(event) => setBrideName(event.target.value, data.brideFirstName)} placeholder="성" className="w-[70px]" />
            <Input value={data.brideFirstName} onChange={(event) => setBrideName(data.brideLastName, event.target.value)} placeholder="이름" className="w-[100px]" />
            <Select value={data.brideRelation} onChange={(event) => update("brideRelation", event.target.value)}><option>딸</option><option>장녀</option><option>차녀</option></Select>
          </div>
        </Field>
        <Checkbox label="신부측 먼저 표시" checked={data.brideFirstDisplay} onChange={(value) => update("brideFirstDisplay", value)} />
      </Section>

      <Section title="모시는 글" {...sectionProps("greeting")}>
        <Field label="제목"><Input value={data.messageTitle} onChange={(event) => update("messageTitle", event.target.value)} /></Field>
        <Field label="내용"><Textarea value={data.message} onChange={(event) => update("message", event.target.value)} rows={8} className="text-center" /></Field>
      </Section>

      <Section title="예식일시" {...sectionProps("datetime")}>
        <Field label="예식일"><Input type="date" value={data.weddingDate} onChange={(event) => update("weddingDate", event.target.value)} className="w-[170px]" /></Field>
        <Field label="예식시간">
          <div className="flex gap-2">
            <Select value={data.weddingPeriod} onChange={(event) => {
              const period = event.target.value;
              const h = parseInt(data.weddingHour.replace("시", ""), 10);
              const m = parseInt(data.weddingMinute.replace("분", ""), 10);
              let hh = h;
              if (period === "오후" && h !== 12) hh = h + 12;
              if (period === "오전" && h === 12) hh = 0;
              patch({ weddingPeriod: period, weddingTime: `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
            }}><option>오전</option><option>오후</option></Select>
            <Select value={data.weddingHour} onChange={(event) => {
              const hourStr = event.target.value;
              const h = parseInt(hourStr.replace("시", ""), 10);
              const m = parseInt(data.weddingMinute.replace("분", ""), 10);
              let hh = h;
              if (data.weddingPeriod === "오후" && h !== 12) hh = h + 12;
              if (data.weddingPeriod === "오전" && h === 12) hh = 0;
              patch({ weddingHour: hourStr, weddingTime: `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
            }}>
              {Array.from({ length: 12 }, (_, index) => `${index + 1}시`).map((hour) => <option key={hour}>{hour}</option>)}
            </Select>
            <Select value={data.weddingMinute} onChange={(event) => {
              const minStr = event.target.value;
              const m = parseInt(minStr.replace("분", ""), 10);
              const h = parseInt(data.weddingHour.replace("시", ""), 10);
              let hh = h;
              if (data.weddingPeriod === "오후" && h !== 12) hh = h + 12;
              if (data.weddingPeriod === "오전" && h === 12) hh = 0;
              patch({ weddingMinute: minStr, weddingTime: `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
            }}>
              {["00분", "10분", "20분", "30분", "40분", "50분"].map((minute) => <option key={minute}>{minute}</option>)}
            </Select>
          </div>
        </Field>
        <Field label="표시">
          <div className="space-y-1">
            <Checkbox label="달력" checked={data.showCalendar} onChange={(value) => update("showCalendar", value)} />
            <Checkbox label="D-Day" checked={data.showDday} onChange={(value) => update("showDday", value)} />
            <Checkbox label="카운트다운" checked={data.showCountdown} onChange={(value) => update("showCountdown", value)} />
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#aaa]">ⓘ 6개월 이내의 예식일만 선택할 수 있습니다.</p>
        </Field>
      </Section>

      <Section title="예식장소" {...sectionProps("venue")}>
        <Field label="제목"><Input value={locationState.title ?? data.venueTitle} onChange={(event) => updateLocation("title", event.target.value)} /></Field>
        <Field label="예식장명"><Input value={data.location?.venueName ?? data.venueName} onChange={(event) => updateLocation("venueName", event.target.value)} /></Field>
        <Field label="층과 홀"><Input value={data.location?.hallName ?? data.venueHall} onChange={(event) => updateLocation("hallName", event.target.value)} /></Field>
        <Field label="주소">
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                value={addressDraft ?? locationState.address}
                onChange={(event) => {
                  const val = event.target.value;
                  setAddressDraft(val);
                  // 주소 텍스트는 항상 즉시 반영 — 단 lat/lng는 updateLocation이 자동 초기화
                  updateLocation("address", val);
                }}
                placeholder="예: 서울 서초구 강남대로107길 6 또는 더리버사이드 호텔"
              />
              <button
                type="button"
                onClick={searchLocationAddress}
                disabled={isSearchingLocation}
                className="h-9 shrink-0 rounded-[4px] border border-[#222] bg-white px-4 text-[13px] font-semibold text-[#111] transition hover:bg-[#f8f3ef] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearchingLocation ? "검색 중" : "검색"}
              </button>
            </div>
            <p className="text-[11px] leading-5 text-[#aaa]">
              정확한 검색을 위해 도로명 주소를 권장합니다. 장소명만 입력하면 카카오 장소 검색 결과에서 선택하세요.
            </p>
          </div>
        </Field>
        {/* 장소 검색 결과 목록 */}
        {locationSearchResults.length > 0 && (
          <div className="ml-[108px] overflow-hidden rounded-[4px] border border-[#e0d8d2] bg-white shadow-sm">
            {locationSearchResults.map((result, index) => (
              <button
                key={result.placeId ?? index}
                type="button"
                onClick={() => commitLocationResult(result)}
                className="flex w-full flex-col items-start border-b border-[#f0ece8] px-4 py-3 text-left text-[12px] last:border-0 hover:bg-[#faf7f3]"
              >
                <span className="font-semibold text-[#2f2825]">{result.placeName}</span>
                {result.roadAddress && <span className="mt-0.5 text-[#756962]">{result.roadAddress}</span>}
                {result.jibunAddress && result.jibunAddress !== result.roadAddress && (
                  <span className="text-[#a8a098]">{result.jibunAddress}</span>
                )}
              </button>
            ))}
          </div>
        )}
        {/* 지도 미리보기 (검색 성공 후) */}
        <div className="ml-[108px] overflow-hidden rounded-[4px] border border-[#e5ded8] bg-[#faf7f2]">
          {hasEditorMapTarget ? (
            <KakaoMap
              venueName={locationState.venueName}
              address={locationState.address}
              lat={locationState.lat}
              lng={locationState.lng}
              height={280}
            />
          ) : (
            <div className="grid h-[280px] place-items-center bg-[#f3eee8] px-6 text-center text-[13px] leading-6 text-[#8f8077]">
              도로명 주소 또는 장소명을 입력한 뒤 [검색]을 눌러주세요.
            </div>
          )}
        </div>
        {locationSearchMessage && (
          <p className="ml-[108px] whitespace-pre-line text-[12px] leading-5 text-[#8f8077]">{locationSearchMessage}</p>
        )}
      </Section>

      <Section title="교통수단" {...sectionProps("transport")}>
        {data.transports.map((transport) => (
          <div key={transport.id} className="border-t border-dashed border-[#e5e5e5] pt-4 first:border-0 first:pt-0">
            <Field label="교통수단"><Input value={transport.title} onChange={(event) => updateTransport(transport.id, { title: event.target.value })} /></Field>
            <Field label="설명"><Textarea value={transport.description} onChange={(event) => updateTransport(transport.id, { description: event.target.value })} rows={3} /></Field>
          </div>
        ))}
      </Section>

      <Section title="갤러리" {...sectionProps("gallery")}>
        <Field label="사용"><Checkbox label="갤러리 표시" checked={galleryEnabled} onChange={(value) => setMenuEnabled("gallery", value)} /></Field>
        <Field label="제목">
          <Input value={data.galleryTitle} onChange={(event) => syncGallery(galleryImages, { galleryTitle: event.target.value })} className="max-w-[220px]" />
        </Field>
        <Field label="타입">
          <div className="flex gap-2">
            {["슬라이드", "바둑판", "그리드"].map((type) => (
              <Chip key={type} active={galleryTypeToLabel(data.gallery?.type ?? data.galleryType) === type} onClick={() => syncGallery(galleryImages, { galleryType: labelToGalleryType(type) })}>
                {type}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="화살표"><Checkbox label="슬라이드 화살표 표시" checked={data.gallery?.showArrows ?? data.showGalleryArrows} onChange={(value) => syncGallery(galleryImages, { showGalleryArrows: value })} /></Field>
        <Field label="사진"><UploadBox imageUrl="" type="gallery" onSelect={selectFiles} label="사진 업로드" /></Field>
        <div className="ml-[108px] rounded border border-dashed border-[#ddd] bg-[#fafafa] px-4 py-5 text-[12px] leading-6 text-[#999]">
          여러 장을 한 번에 선택할 수 있습니다. 최대 60장까지 첨부됩니다.
          <div className="mt-1 font-medium text-[#777]">{galleryImages.length} / 60</div>
        </div>
        {galleryImages.length > 0 && (
          <div className="ml-[108px] grid grid-cols-3 gap-2 sm:grid-cols-5">
            {galleryImages.map((image, index) => {
              const src = image.previewUrl || image.url || image.dataUrl || "";
              return (
                <div key={image.id} className="group relative aspect-square overflow-hidden rounded border border-[#ddd] bg-[#f5f5f5]">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggedGalleryId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => moveGallery(image.id)}
                    className="h-full w-full cursor-move"
                    title="드래그로 순서 변경"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                  <button type="button" onClick={() => removeGalleryImage(image.id)} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/55 text-[13px] text-white" aria-label="사진 삭제">
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 right-1 flex justify-between gap-1 opacity-0 transition group-hover:opacity-100">
                    <button type="button" onClick={() => moveGalleryByIndex(index, -1)} className="h-6 flex-1 rounded bg-white/85 text-[11px] text-[#555]" disabled={index === 0}>↑</button>
                    <button type="button" onClick={() => moveGalleryByIndex(index, 1)} className="h-6 flex-1 rounded bg-white/85 text-[11px] text-[#555]" disabled={index === galleryImages.length - 1}>↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="연락하기" {...sectionProps("contacts")}>
        {data.contacts.map((contact) => (
          <div key={contact.id} className="grid grid-cols-[104px_90px_minmax(0,1fr)] gap-2">
            <Input value={contact.role} onChange={(event) => updateContact(contact.id, { role: event.target.value })} />
            <Input value={contact.name} onChange={(event) => updateContact(contact.id, { name: event.target.value })} placeholder="이름" />
            <Input value={contact.phone} onChange={(event) => updateContact(contact.id, { phone: event.target.value })} placeholder="전화번호" />
          </div>
        ))}
      </Section>

      <Section title="계좌번호" {...sectionProps("accounts")}>
        <Field label="사용"><Checkbox label="계좌번호 표시" checked={data.menuOrder.find((item) => item.id === "accounts")?.enabled ?? true} onChange={(value) => setMenuEnabled("accounts", value)} /></Field>
        {data.bankAccounts.map((account) => (
          <div key={account.id} className="space-y-3 border-t border-dashed border-[#e5e5e5] pt-4 first:border-0 first:pt-0">
            <Field label="그룹명"><Input value={account.groupName} onChange={(event) => updateAccount(account.id, { groupName: event.target.value })} /></Field>
            <Field label="계좌번호">
              <div className="flex gap-2">
                <Input value={account.bankName} onChange={(event) => updateAccount(account.id, { bankName: event.target.value })} placeholder="은행" className="w-[130px]" />
                <Input value={account.accountNumber} onChange={(event) => updateAccount(account.id, { accountNumber: event.target.value })} placeholder="계좌번호" />
              </div>
            </Field>
            <Field label="예금주"><Input value={account.accountHolder} onChange={(event) => updateAccount(account.id, { accountHolder: event.target.value })} /></Field>
          </div>
        ))}
      </Section>

      <Section title="동영상" {...sectionProps("video")}>
        <Field label="유튜브 URL">
          <Input
            value={data.youtubeUrl}
            onChange={(event) => {
              const url = event.target.value;
              const videoId = extractYouTubeVideoId(url);
              patch({ youtubeUrl: url, youtubeVideoId: videoId, youtubeError: url && !videoId ? "올바른 YouTube URL을 입력해주세요." : "" });
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Field>
        {data.youtubeError && <Help>{data.youtubeError}</Help>}
        {youtubePreviewId && <Help>영상 ID: {youtubePreviewId}</Help>}
      </Section>

      <Section title="배경음악" {...sectionProps("music")}>
        <Field label="나의 음원"><UploadBox imageUrl="" type="audio" onSelect={selectFiles} label="MP3 업로드" /></Field>
        {data.audioUrl && <audio src={data.audioUrl} controls className="ml-[108px] w-[min(100%,420px)]" />}
      </Section>

      <Section title="안내사항" {...sectionProps("notice")}>
        <Field label="내용"><Textarea value={data.noticeGroupBody} onChange={(event) => update("noticeGroupBody", event.target.value)} rows={5} /></Field>
      </Section>

      <Section title="참석의사" badge="RSVP" {...sectionProps("rsvp")}>
        <Field label="제목"><Input value={data.rsvpTitle} onChange={(event) => update("rsvpTitle", event.target.value)} /></Field>
        <Field label="설명"><Textarea value={data.rsvpDescription} onChange={(event) => update("rsvpDescription", event.target.value)} rows={4} /></Field>
      </Section>

      <Section title="방명록" {...sectionProps("guestbook")}>
        <Field label="제목"><Input value={data.guestbookTitle} onChange={(event) => update("guestbookTitle", event.target.value)} /></Field>
      </Section>

      <Section title="사진 & 글귀" {...sectionProps("quote")}>
        <Field label="사진"><UploadBox imageUrl={data.quoteImage} type="quote" onSelect={selectFiles} /></Field>
        <Field label="글귀"><Textarea value={data.quoteText} onChange={(event) => update("quoteText", event.target.value)} rows={5} /></Field>
      </Section>

      <Section title="카카오톡 공유 썸네일" {...sectionProps("kakaoShare")}>
        <Field label="사진"><UploadBox imageUrl={data.kakaoThumbnailUrl} type="kakao_thumbnail" onSelect={selectFiles} /></Field>
        <Field label="제목"><Input value={data.kakaoShareTitle} onChange={(event) => update("kakaoShareTitle", event.target.value)} placeholder="결혼합니다" /></Field>
      </Section>

      <Section title="URL 공유 썸네일" {...sectionProps("urlShare")}>
        <Field label="사진"><UploadBox imageUrl={data.urlThumbnailUrl} type="url_thumbnail" onSelect={selectFiles} /></Field>
        <Field label="제목"><Input value={data.urlShareTitle} onChange={(event) => update("urlShareTitle", event.target.value)} placeholder="결혼합니다" /></Field>
      </Section>

      <Section title="메뉴 순서 변경" {...sectionProps("menuOrder")}>
        <div className="w-full max-w-[360px] overflow-hidden border border-[#e5e5e5]">
          {data.menuOrder.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedMenuId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveMenu(item.id)}
              className="flex h-10 cursor-move items-center justify-between border-b border-[#ededed] bg-white px-4 text-[13px] last:border-0"
            >
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={item.enabled} onChange={(event) => setMenuEnabled(item.id, event.target.checked)} className="size-4 accent-[#555]" />
                <span>{menuLabels[item.id] ?? item.label}</span>
              </label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveMenuByIndex(index, -1)} className="h-6 w-6 rounded bg-[#f6f6f6] text-[11px] text-[#777]" aria-label="위로 이동">↑</button>
                <button type="button" onClick={() => moveMenuByIndex(index, 1)} className="h-6 w-6 rounded bg-[#f6f6f6] text-[11px] text-[#777]" aria-label="아래로 이동">↓</button>
                <span className="pl-1 text-[#bbb]">☰</span>
              </div>
            </div>
          ))}
        </div>
        <Help>항목을 드래그하거나 버튼으로 순서를 변경할 수 있습니다.</Help>
      </Section>
    </div>
  );
}
