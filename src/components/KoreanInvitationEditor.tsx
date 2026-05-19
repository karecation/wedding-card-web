"use client";

import { useMemo, useState } from "react";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { validateUploadFile, type PendingUpload } from "@/lib/upload";
import type {
  BankAccountItem,
  ContactItem,
  GalleryImage,
  ImageUploadType,
  InvitationData,
  IntroTemplate,
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

const introTemplates: Array<{ id: IntroTemplate; label: string; hint: string }> = [
  { id: "basicDate", label: "기본", hint: "날짜 중심" },
  { id: "photoFirst", label: "사진형", hint: "사진 우선" },
  { id: "saveTheDate", label: "세이브", hint: "감성 커버" },
  { id: "minimal", label: "미니멀", hint: "여백 중심" },
];

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
      className={`h-9 w-full min-w-0 rounded-[4px] border border-[#ebebeb] bg-white px-3 text-[13px] text-[#161616] outline-none placeholder:text-[#bcbcbc] focus:border-[#999] ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full min-w-0 rounded-[4px] border border-[#ebebeb] bg-white px-3 py-2 text-[13px] leading-6 text-[#161616] outline-none placeholder:text-[#bcbcbc] focus:border-[#999] ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-9 rounded-[4px] border border-[#ebebeb] bg-white px-3 text-[13px] text-[#161616] outline-none focus:border-[#999] ${props.className ?? ""}`}
    />
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex min-h-7 cursor-pointer items-center gap-2 text-[12px] text-[#555]">
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
        active ? "border border-[#222] bg-white text-[#111]" : "border border-transparent bg-[#f6f6f6] text-[#999] hover:text-[#555]"
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
    <section className="overflow-hidden border border-[#ebebeb] bg-white">
      <button type="button" onClick={onToggle} className="flex h-[54px] w-full items-center justify-between px-5 text-left">
        <span className="flex items-center gap-2">
          <span className="grid size-4 place-items-center rounded-full bg-[#555] text-[10px] text-white">✓</span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#111]">{title}</span>
          {badge && <span className="rounded bg-[#f4f4f4] px-1.5 py-0.5 text-[10px] text-[#999]">{badge}</span>}
        </span>
        <span className="text-[18px] leading-none text-[#555]">{open ? "⌃" : "⌄"}</span>
      </button>
      {open && <div className="space-y-4 border-t border-[#f1f1f1] px-5 py-5">{children}</div>}
    </section>
  );
}

function UploadBox({
  imageUrl,
  type,
  label = "클릭 후 업로드",
  onSelect,
}: {
  imageUrl: string;
  type: ImageUploadType | "audio";
  label?: string;
  onSelect: (type: ImageUploadType | "audio", files: FileList) => void;
}) {
  return (
    <label className="grid h-[146px] w-[146px] cursor-pointer place-items-center overflow-hidden rounded-[4px] border border-[#dedede] bg-[#f7f7f7] text-center text-[12px] text-[#f06f52] transition hover:border-[#c9c9c9]">
      {imageUrl && type !== "audio" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{label}</span>
      )}
      <input
        type="file"
        accept={type === "audio" ? "audio/mpeg,.mp3" : "image/*"}
        multiple={type === "gallery"}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) onSelect(type, event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-6 text-[#999]">{children}</p>;
}

function readFileDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

function orderedGalleryImages(data: InvitationData) {
  const source = data.gallery?.images?.length ? data.gallery.images : data.galleryItems;
  return source
    .map((image, index) => ({
      ...image,
      previewUrl: image.previewUrl || image.url || "",
      order: image.order ?? index,
    }))
    .filter((image) => image.previewUrl || image.url)
    .sort((a, b) => a.order - b.order)
    .map((image, index) => ({ ...image, order: index }));
}

export default function KoreanInvitationEditor({ data, onChange, onPendingUpload }: Props) {
  const [openSections, setOpenSections] = useState(sectionSeed);
  const [uploadError, setUploadError] = useState("");
  const [draggedMenuId, setDraggedMenuId] = useState<MenuSectionId | null>(null);
  const [draggedGalleryId, setDraggedGalleryId] = useState<string | null>(null);

  const galleryImages = orderedGalleryImages(data);
  const galleryEnabled = data.menuOrder.find((item) => item.id === "gallery")?.enabled ?? data.gallery?.enabled ?? false;

  const update = <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => onChange({ ...data, [key]: value });
  const patch = (next: Partial<InvitationData>) => onChange({ ...data, ...next });
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
      galleryImages: orderedImages.map((image) => image.previewUrl || image.url || "").filter(Boolean),
      menuOrder:
        extra?.menuOrder ??
        data.menuOrder.map((menu) => (menu.id === "gallery" ? { ...menu, enabled: nextEnabled } : menu)),
    });
  };

  const selectFiles = async (type: ImageUploadType | "audio", files: FileList) => {
    setUploadError("");

    const incomingFiles = Array.from(files)
      .filter((file) => (type === "audio" ? true : file.type.startsWith("image/")))
      .slice(0, type === "gallery" ? Math.max(0, 60 - galleryImages.length) : 1);

    const nextGalleryItems: GalleryImage[] = [];

    for (const file of incomingFiles) {
      const error = validateUploadFile(file, type);
      if (error) {
        setUploadError(error);
        continue;
      }

      const id = createClientId(type);
      const previewUrl = type === "audio" ? URL.createObjectURL(file) : await readFileDataUrl(file);
      onPendingUpload?.({ id, type, file, previewUrl });

      if (type === "main") update("coverImage", previewUrl);
      if (type === "intro") update("introImage", previewUrl);
      if (type === "quote") update("quoteImage", previewUrl);
      if (type === "kakao_thumbnail") update("kakaoThumbnailUrl", previewUrl);
      if (type === "url_thumbnail") update("urlThumbnailUrl", previewUrl);
      if (type === "audio") patch({ audioUrl: previewUrl, musicUrl: previewUrl, audioTitle: file.name });
      if (type === "gallery") {
        nextGalleryItems.push({
          id,
          file,
          url: previewUrl,
          previewUrl,
          caption: "",
          order: galleryImages.length + nextGalleryItems.length,
          type: "gallery",
        });
      }
    }

    if (type === "gallery" && nextGalleryItems.length > 0) {
      syncGallery([...galleryImages, ...nextGalleryItems].slice(0, 60));
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
  const updateTransport = (id: string, item: Partial<TransportItem>) => update("transports", data.transports.map((transport) => (transport.id === id ? { ...transport, ...item } : transport)));
  const updateContact = (id: string, item: Partial<ContactItem>) => update("contacts", data.contacts.map((contact) => (contact.id === id ? { ...contact, ...item } : contact)));
  const updateAccount = (id: string, item: Partial<BankAccountItem>) => update("bankAccounts", data.bankAccounts.map((account) => (account.id === id ? { ...account, ...item } : account)));
  const youtubePreviewId = useMemo(() => extractYouTubeVideoId(data.youtubeUrl), [data.youtubeUrl]);

  return (
    <div className="space-y-4">
      {uploadError && <div className="border border-[#f4c7bd] bg-[#fff5f2] px-4 py-3 text-[12px] text-[#d8563d]">{uploadError}</div>}

      <Section title="테마" {...sectionProps("theme")}>
        <Field label="테마">
          <Select value={data.templateMood} onChange={(event) => update("templateMood", event.target.value)} className="w-[180px]">
            <option>모던</option>
            <option>미니멀</option>
            <option>클래식</option>
            <option>로맨틱</option>
            <option>내추럴</option>
          </Select>
        </Field>
        <Field label="컬러">
          <div className="flex items-center gap-2">
            {[
              ["#c9897a", "ivory"],
              ["#b78f72", "beige"],
              ["#d8a0a6", "pink"],
            ].map(([color, name]) => (
              <button
                key={color}
                type="button"
                aria-label={name}
                onClick={() => update("themeColor", color)}
                className={`size-7 rounded-full border ${data.themeColor === color ? "border-[#222]" : "border-[#ddd]"}`}
                style={{ backgroundColor: color }}
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
        <Field label="레이아웃">
          <div className="grid grid-cols-2 gap-2 min-[560px]:grid-cols-4">
            {introTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => update("introTemplate", template.id)}
                className={`h-[112px] min-w-0 rounded-[4px] border p-2 text-left transition ${data.introTemplate === template.id ? "border-[#111] bg-white" : "border-[#ededed] bg-[#f7f7f7]"}`}
              >
                <div className="mb-2 h-[45px] rounded bg-[#ddd]" />
                <p className="truncate text-[12px] leading-[17px] text-[#111]">{template.label}</p>
                <p className="mt-0.5 truncate text-[10px] leading-[14px] text-[#999]">{template.hint}</p>
                <span className="mt-1 block h-[3px] w-6 rounded-full bg-[#e6d8cf]" />
              </button>
            ))}
          </div>
        </Field>
        <Field label="프레임">
          <div className="flex flex-wrap gap-2">
            {["기본", "아치", "타원", "액자", "채우기"].map((shape) => <Chip key={shape} active={data.introShape === shape} onClick={() => update("introShape", shape)}>{shape}</Chip>)}
          </div>
        </Field>
        <Field label="대표 사진"><UploadBox imageUrl={data.coverImage} type="main" onSelect={selectFiles} /></Field>
        <Field label="이펙트">
          <div className="flex gap-2">
            {["없음", "물결", "안개"].map((effect) => <Chip key={effect} active={data.photoEffect === effect} onClick={() => update("photoEffect", effect)}>{effect}</Chip>)}
          </div>
        </Field>
        <Field label="파티클">
          <div className="flex flex-wrap gap-2">
            {["없음", "눈송이", "하트", "벚꽃", "은행잎"].map((particle) => (
              <Chip key={particle} active={data.particle === particle} onClick={() => update("particle", particle)}>{particle}</Chip>
            ))}
          </div>
        </Field>
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
            <Select value={data.weddingPeriod} onChange={(event) => update("weddingPeriod", event.target.value)}><option>오전</option><option>오후</option></Select>
            <Select value={data.weddingHour} onChange={(event) => update("weddingHour", event.target.value)}>
              {Array.from({ length: 12 }, (_, index) => `${index + 1}시`).map((hour) => <option key={hour}>{hour}</option>)}
            </Select>
            <Select value={data.weddingMinute} onChange={(event) => update("weddingMinute", event.target.value)}>
              {["00분", "10분", "20분", "30분", "40분", "50분"].map((minute) => <option key={minute}>{minute}</option>)}
            </Select>
          </div>
        </Field>
      </Section>

      <Section title="예식장소" {...sectionProps("venue")}>
        <Field label="예식장명"><Input value={data.venueName} onChange={(event) => update("venueName", event.target.value)} /></Field>
        <Field label="층과 홀"><Input value={data.venueHall} onChange={(event) => update("venueHall", event.target.value)} /></Field>
        <Field label="주소"><Input value={data.venueAddress} onChange={(event) => update("venueAddress", event.target.value)} /></Field>
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
              const src = image.previewUrl || image.url || "";
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
