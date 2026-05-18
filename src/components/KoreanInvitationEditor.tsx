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
  MenuOrderItem,
  TransportItem,
} from "@/types/invitation";

type KoreanInvitationEditorProps = {
  data: InvitationData;
  isSaving?: boolean;
  onChange: (data: InvitationData) => void;
  onPendingUpload?: (upload: PendingUpload) => void;
};

type EditorSectionProps = {
  id: string;
  title: string;
  checked?: boolean;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const themeColors = ["#f5f5f5", "#f5eee2", "#f8e7e4"];
const effectOptions = ["없음", "물결", "안개"] as const;
const particleOptions = ["없음", "벚꽃잎", "눈송이", "하트", "데이지", "벚꽃", "은행잎", "낙엽"] as const;
const defaultMusicOptions = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

function EditorSection({ id, title, checked = true, badge, isOpen, onToggle, children }: EditorSectionProps) {
  return (
    <section id={id} className="border border-[#e6e6e6] bg-white text-[#111]">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-[58px] w-full items-center justify-between border-b border-[#ededed] px-7 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`grid size-[17px] shrink-0 place-items-center rounded-full border text-[10px] ${
              checked ? "border-[#5b5b5b] bg-[#5b5b5b] text-white" : "border-[#b8b8b8] bg-white text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="truncate text-[16px] font-semibold tracking-[-0.02em]">{title}</span>
          {badge && <span className="rounded-sm bg-[#f5f5f5] px-1.5 py-0.5 text-[11px] text-[#999]">{badge}</span>}
        </span>
        <span className="text-[18px] leading-none text-[#111]">{isOpen ? "⌃" : "⌄"}</span>
      </button>
      {isOpen && <div className="px-7 py-6">{children}</div>}
    </section>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-4">
      <label className="pt-2 text-[13px] leading-5 tracking-[-0.02em] text-[#222]">{label}</label>
      <div>{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[38px] w-full rounded-[4px] border border-[#e1e1e1] bg-white px-3 text-[13px] text-[#111] outline-none placeholder:text-[#bbb] focus:border-[#111] ${props.className ?? ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-[38px] rounded-[4px] border border-[#e1e1e1] bg-white px-3 text-[13px] text-[#111] outline-none focus:border-[#111] ${props.className ?? ""}`}
    />
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-7 items-center gap-2 text-[13px] text-[#555]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#555]" />
      <span className="whitespace-nowrap">{label}</span>
    </label>
  );
}

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-[8px] px-4 text-[13px] transition ${
        active ? "border border-[#111] bg-white text-[#111]" : "border border-transparent bg-[#f7f7f7] text-[#aaa]"
      }`}
    >
      {children}
    </button>
  );
}

function UploadBox({
  imageUrl,
  type,
  onSelect,
  label = "클릭 후 업로드",
}: {
  imageUrl: string;
  type: ImageUploadType | "audio";
  onSelect: (type: ImageUploadType | "audio", files: FileList) => void;
  label?: string;
}) {
  return (
    <label className="grid h-[160px] w-[160px] cursor-pointer place-items-center overflow-hidden border border-[#dedede] bg-[#f7f7f7] text-[12px] text-[#f06f52]">
      {imageUrl && type !== "audio" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        label
      )}
      <input
        type="file"
        accept={type === "audio" ? "audio/mpeg,.mp3" : "image/jpeg,image/png,image/webp"}
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

const initialOpenSections = [
  "theme",
  "intro",
  "photo",
  "groom",
  "bride",
  "message",
  "datetime",
  "venue",
  "transport",
  "gallery",
  "contacts",
  "accounts",
  "video",
  "music",
  "rsvp",
  "guestbook",
  "quote",
  "kakaoThumb",
  "urlThumb",
  "menuOrder",
  "qr",
];

export default function KoreanInvitationEditor({ data, onChange, onPendingUpload }: KoreanInvitationEditorProps) {
  const [openSections, setOpenSections] = useState<string[]>(initialOpenSections);
  const [uploadError, setUploadError] = useState("");
  const [draggedMenuId, setDraggedMenuId] = useState<string | null>(null);

  const update = <Key extends keyof InvitationData>(key: Key, value: InvitationData[Key]) => {
    onChange({ ...data, [key]: value });
  };

  const toggleSection = (id: string) => {
    setOpenSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const sectionProps = (id: string) => ({
    id,
    isOpen: openSections.includes(id),
    onToggle: () => toggleSection(id),
  });

  const selectFiles = (type: ImageUploadType | "audio", files: FileList) => {
    setUploadError("");
    const fileList = Array.from(files);

    fileList.forEach((file) => {
      const error = validateUploadFile(file, type);
      if (error) {
        setUploadError(error);
        return;
      }

      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      onPendingUpload?.({ id, type, file, previewUrl });

      if (type === "main") update("coverImage", previewUrl);
      if (type === "intro") update("introImage", previewUrl);
      if (type === "quote") update("quoteImage", previewUrl);
      if (type === "kakao_thumbnail") update("kakaoThumbnailUrl", previewUrl);
      if (type === "url_thumbnail") update("urlThumbnailUrl", previewUrl);
      if (type === "audio") {
        onChange({ ...data, audioUrl: previewUrl, musicUrl: previewUrl, audioTitle: file.name });
      }
      if (type === "gallery") {
        const item: GalleryImage = { id, url: previewUrl, type: "gallery" };
        onChange({
          ...data,
          galleryItems: [...data.galleryItems, item].slice(0, 60),
          galleryImages: [...data.galleryImages, previewUrl].slice(0, 60),
        });
      }
    });
  };

  const updateNames = (side: "groom" | "bride", lastName: string, firstName: string) => {
    if (side === "groom") onChange({ ...data, groomLastName: lastName, groomFirstName: firstName, groomName: `${lastName}${firstName}` });
    if (side === "bride") onChange({ ...data, brideLastName: lastName, brideFirstName: firstName, brideName: `${lastName}${firstName}` });
  };

  const updateTransport = (id: string, patch: Partial<TransportItem>) => {
    update(
      "transports",
      data.transports.map((transport) => (transport.id === id ? { ...transport, ...patch } : transport)),
    );
  };

  const updateContact = (id: string, patch: Partial<ContactItem>) => {
    update(
      "contacts",
      data.contacts.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact)),
    );
  };

  const updateAccount = (id: string, patch: Partial<BankAccountItem>) => {
    update(
      "bankAccounts",
      data.bankAccounts.map((account) => (account.id === id ? { ...account, ...patch } : account)),
    );
  };

  const moveMenu = (targetId: string) => {
    if (!draggedMenuId || draggedMenuId === targetId) return;
    const from = data.menuOrder.findIndex((item) => item.id === draggedMenuId);
    const to = data.menuOrder.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...data.menuOrder];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update("menuOrder", next);
  };

  const youtubePreviewId = useMemo(() => extractYouTubeVideoId(data.youtubeUrl), [data.youtubeUrl]);

  return (
    <div className="space-y-5">
      {uploadError && <div className="border border-[#f3c8bd] bg-[#fff3ef] px-4 py-3 text-[13px] text-[#d8563d]">{uploadError}</div>}

      <EditorSection title="테마" {...sectionProps("theme")}>
        <div className="space-y-4">
          <FormRow label="테마">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={data.templateMood} onChange={(event) => update("templateMood", event.target.value as InvitationData["templateMood"])} className="w-[130px]">
                <option>모던 NEW</option>
                <option>고운고딕</option>
                <option>클래식</option>
                <option>로맨틱</option>
                <option>내추럴</option>
              </Select>
              {themeColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update("themeColor", color)}
                  className={`size-8 rounded-full border ${data.themeColor === color ? "border-[#111]" : "border-[#cfcfcf]"}`}
                  style={{ backgroundColor: color }}
                  aria-label="테마 컬러 선택"
                />
              ))}
            </div>
          </FormRow>
          <FormRow label="글꼴">
            <div className="flex gap-2">
              <Select value={data.fontFamily} onChange={(event) => update("fontFamily", event.target.value as InvitationData["fontFamily"])} className="w-[130px]">
                <option>고운고딕</option>
                <option>명조</option>
                <option>프리텐다드</option>
              </Select>
              <Select value={data.fontWeight} onChange={(event) => update("fontWeight", event.target.value as InvitationData["fontWeight"])} className="w-[110px]">
                <option>얇게</option>
                <option>보통</option>
                <option>굵게</option>
              </Select>
            </div>
          </FormRow>
          <FormRow label="옵션">
            <div className="space-y-2">
              <Check label="청첩장 확대 방지" checked={data.preventZoom} onChange={(checked) => update("preventZoom", checked)} />
              <Check label="스크롤 시 등장 효과" checked={data.scrollEffect} onChange={(checked) => update("scrollEffect", checked)} />
            </div>
          </FormRow>
        </div>
      </EditorSection>

      <EditorSection title="인트로" {...sectionProps("intro")}>
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }, (_, index) => (
              <button key={index} type="button" className={`h-[128px] rounded-[3px] border bg-[#f1f1f1] p-2 ${index === 0 ? "border-[#111]" : "border-[#ededed]"}`}>
                <div className="mx-auto h-full w-[64px] bg-white p-1">
                  <div className="h-1/2 bg-[#d7d7d7]" />
                  <div className="mx-auto mt-2 h-1 w-7 bg-[#d7d7d7]" />
                  <div className="mx-auto mt-2 h-1 w-10 bg-[#d7d7d7]" />
                </div>
              </button>
            ))}
          </div>
          <FormRow label="인트로 사진">
            <UploadBox imageUrl={data.introImage} type="intro" onSelect={selectFiles} />
          </FormRow>
          <div className="flex flex-wrap justify-center gap-2">
            {(["기본", "아치", "타원", "액자", "채우기"] as const).map((shape) => (
              <Chip key={shape} active={data.introShape === shape} onClick={() => update("introShape", shape)}>
                {shape}
              </Chip>
            ))}
          </div>
        </div>
      </EditorSection>

      <EditorSection title="사진" {...sectionProps("photo")}>
        <div className="space-y-5">
          <FormRow label="사진">
            <UploadBox imageUrl={data.coverImage} type="main" onSelect={selectFiles} />
          </FormRow>
          <FormRow label="이펙트">
            <div className="flex flex-wrap gap-2">
              {effectOptions.map((effect) => (
                <Chip key={effect} active={data.photoEffect === effect} onClick={() => update("photoEffect", effect)}>
                  {effect}
                </Chip>
              ))}
            </div>
          </FormRow>
          <FormRow label="파티클">
            <div className="flex flex-wrap gap-2">
              {particleOptions.map((particle) => (
                <Chip key={particle} active={data.particle === particle} onClick={() => update("particle", particle)}>
                  {particle}
                </Chip>
              ))}
            </div>
          </FormRow>
        </div>
      </EditorSection>

      <EditorSection title="신랑측 정보" {...sectionProps("groom")}>
        <FamilyFields side="groom" data={data} onChange={onChange} onPersonChange={updateNames} />
      </EditorSection>

      <EditorSection title="신부측 정보" {...sectionProps("bride")}>
        <FamilyFields side="bride" data={data} onChange={onChange} onPersonChange={updateNames} />
        <div className="mt-4 pl-[88px]">
          <Check label="모든 항목 신부측 먼저 표시" checked={data.brideFirstDisplay} onChange={(checked) => update("brideFirstDisplay", checked)} />
        </div>
      </EditorSection>

      <EditorSection title="모시는 글" {...sectionProps("message")}>
        <div className="space-y-4">
          <FormRow label="제목">
            <Input value={data.messageTitle} onChange={(event) => update("messageTitle", event.target.value)} />
          </FormRow>
          <FormRow label="내용">
            <div className="overflow-hidden rounded-[4px] border border-[#e1e1e1]">
              <div className="flex h-9 items-center gap-3 border-b border-[#e1e1e1] bg-[#fafafa] px-3 text-[13px]">
                <button type="button" className="font-bold">가</button>
                <button type="button" className="underline">가</button>
                <button type="button" className="border-b-2 border-[#e54b45]">가</button>
                <span className="h-4 w-px bg-[#ddd]" />
                <button type="button">左</button>
                <button type="button" className="rounded bg-[#e8e8e8] px-2 py-1">中</button>
                <button type="button">右</button>
              </div>
              <textarea value={data.message} onChange={(event) => update("message", event.target.value)} rows={7} className="w-full resize-y bg-white px-4 py-3 text-center text-[13px] leading-7 outline-none" />
              <button type="button" className="flex h-9 w-full items-center border-t border-[#e1e1e1] px-3 text-[13px] text-[#555]">T&nbsp; 샘플 문구</button>
            </div>
          </FormRow>
        </div>
      </EditorSection>

      <EditorSection title="예식일시" {...sectionProps("datetime")}>
        <div className="space-y-4">
          <FormRow label="예식일">
            <Input type="date" value={data.weddingDate} onChange={(event) => update("weddingDate", event.target.value)} className="w-[156px]" />
          </FormRow>
          <FormRow label="예식시간">
            <div className="flex gap-2">
              <Select value={data.weddingPeriod} onChange={(event) => update("weddingPeriod", event.target.value as InvitationData["weddingPeriod"])}>
                <option>오전</option>
                <option>오후</option>
              </Select>
              <Select value={data.weddingHour} onChange={(event) => update("weddingHour", event.target.value)}>
                {Array.from({ length: 12 }, (_, index) => `${index + 1}시`).map((hour) => <option key={hour}>{hour}</option>)}
              </Select>
              <Select value={data.weddingMinute} onChange={(event) => update("weddingMinute", event.target.value)}>
                {["00분", "10분", "20분", "30분", "40분", "50분"].map((minute) => <option key={minute}>{minute}</option>)}
              </Select>
            </div>
          </FormRow>
          <FormRow label="표시">
            <div className="space-y-2">
              <Check label="달력" checked={data.showCalendar} onChange={(checked) => update("showCalendar", checked)} />
              <Check label="D-Day" checked={data.showDday} onChange={(checked) => update("showDday", checked)} />
              <Check label="카운트다운" checked={data.showCountdown} onChange={(checked) => update("showCountdown", checked)} />
            </div>
          </FormRow>
        </div>
      </EditorSection>

      <EditorSection title="예식장소" {...sectionProps("venue")}>
        <div className="space-y-4">
          <FormRow label="제목"><Input value={data.venueTitle} onChange={(event) => update("venueTitle", event.target.value)} /></FormRow>
          <FormRow label="예식장명"><Input value={data.venueName} onChange={(event) => update("venueName", event.target.value)} /></FormRow>
          <FormRow label="층과 홀"><Input value={data.venueHall} onChange={(event) => update("venueHall", event.target.value)} /></FormRow>
          <FormRow label="주소">
            <div className="flex gap-2">
              <Input value={data.venueAddress} onChange={(event) => update("venueAddress", event.target.value)} />
              <button type="button" className="h-[38px] w-[58px] rounded-[4px] border border-[#111] text-[13px]">검색</button>
            </div>
          </FormRow>
          <div className="grid h-[210px] place-items-center border border-[#ddd] bg-[linear-gradient(115deg,#f7f2ea,#fff,#eef2ef)] text-[13px] font-semibold text-[#333]">
            {process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              ? "지도 API 연결 준비됨"
              : "지도 API 키가 없으면 placeholder가 표시됩니다"}
          </div>
          <div className="space-y-2 pl-[88px]">
            <Check label="지도 표시" checked={data.showMap} onChange={(checked) => update("showMap", checked)} />
            <Check label="지도 잠금" checked={data.lockMap} onChange={(checked) => update("lockMap", checked)} />
            <Check label="약도 첨부" checked={data.attachMap} onChange={(checked) => update("attachMap", checked)} />
          </div>
        </div>
      </EditorSection>

      <EditorSection title="교통수단" {...sectionProps("transport")}>
        <div className="space-y-5">
          <Check label="아이콘 표시" checked={data.showTransportIcons} onChange={(checked) => update("showTransportIcons", checked)} />
          {data.transports.map((transport) => (
            <div key={transport.id} className="grid grid-cols-[72px_minmax(0,1fr)_22px] gap-4 border-t border-dashed border-[#ddd] pt-5">
              <label className="pt-2 text-[13px]">교통수단</label>
              <div className="space-y-2">
                <Input value={transport.title} onChange={(event) => updateTransport(transport.id, { title: event.target.value })} />
                <textarea value={transport.description} onChange={(event) => updateTransport(transport.id, { description: event.target.value })} rows={5} className="w-full rounded-[4px] border border-[#e1e1e1] px-3 py-2 text-[13px] outline-none focus:border-[#111]" />
              </div>
              <button type="button" onClick={() => update("transports", data.transports.filter((item) => item.id !== transport.id))} className="size-5 rounded bg-[#f1f1f1] text-[11px]">×</button>
            </div>
          ))}
          <div className="flex justify-center border-t border-dashed border-[#ddd] pt-5">
            <button type="button" onClick={() => update("transports", [...data.transports, { id: `transport-${Date.now()}`, title: "교통수단", description: "" }])} className="h-10 rounded-full border border-[#111] px-8 text-[13px]">+ 교통수단 추가</button>
          </div>
        </div>
      </EditorSection>

      <EditorSection title="갤러리" {...sectionProps("gallery")}>
        <div className="space-y-4">
          <FormRow label="제목"><Input value={data.galleryTitle} onChange={(event) => update("galleryTitle", event.target.value)} className="max-w-[200px]" /></FormRow>
          <FormRow label="갤러리 타입">
            <div className="flex gap-2">
              {(["슬라이드", "바둑판", "그리드"] as const).map((type) => (
                <Chip key={type} active={data.galleryType === type} onClick={() => update("galleryType", type)}>{type}</Chip>
              ))}
            </div>
          </FormRow>
          <FormRow label="사진">
            <UploadBox imageUrl="" type="gallery" onSelect={selectFiles} label="사진 업로드" />
          </FormRow>
          {data.galleryItems.length > 0 && (
            <div className="grid grid-cols-4 gap-2 pl-[88px]">
              {data.galleryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ ...data, galleryItems: data.galleryItems.filter((image) => image.id !== item.id), galleryImages: data.galleryImages.filter((url) => url !== item.url) })}
                  className="aspect-square overflow-hidden border border-[#ddd]"
                  title="클릭하면 삭제됩니다"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="pl-[88px] text-[12px] text-[#999]">사진은 최대 60장까지 첨부할 수 있습니다.</p>
        </div>
      </EditorSection>

      <EditorSection title="연락하기" {...sectionProps("contacts")}>
        <div className="space-y-2">
          {data.contacts.map((contact) => (
            <div key={contact.id} className="grid grid-cols-[104px_84px_1fr] gap-2">
              <Input value={contact.role} onChange={(event) => updateContact(contact.id, { role: event.target.value })} />
              <Input value={contact.name} onChange={(event) => updateContact(contact.id, { name: event.target.value })} />
              <Input value={contact.phone} onChange={(event) => updateContact(contact.id, { phone: event.target.value })} placeholder="전화번호" />
            </div>
          ))}
          <p className="border-t border-[#efefef] pt-4 text-[12px] text-[#999]">전화번호가 입력된 항목만 표시됩니다.</p>
        </div>
      </EditorSection>

      <EditorSection title="계좌번호" {...sectionProps("accounts")}>
        <div className="space-y-7">
          {data.bankAccounts.map((account) => (
            <div key={account.id} className="space-y-3 border-t border-dashed border-[#ddd] pt-5">
              <FormRow label="그룹명"><Input value={account.groupName} onChange={(event) => updateAccount(account.id, { groupName: event.target.value })} /></FormRow>
              <FormRow label="계좌번호">
                <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-2">
                  <Input placeholder="은행" value={account.bankName} onChange={(event) => updateAccount(account.id, { bankName: event.target.value })} />
                  <Input placeholder="계좌번호" value={account.accountNumber} onChange={(event) => updateAccount(account.id, { accountNumber: event.target.value })} />
                </div>
              </FormRow>
              <FormRow label="예금주"><Input value={account.accountHolder} onChange={(event) => updateAccount(account.id, { accountHolder: event.target.value })} /></FormRow>
              <FormRow label="간편송금"><Check label="카카오페이" checked={account.kakaoPayEnabled} onChange={(checked) => updateAccount(account.id, { kakaoPayEnabled: checked })} /></FormRow>
              <FormRow label="펼쳐두기"><Check label="숨김" checked={account.hidden} onChange={(checked) => updateAccount(account.id, { hidden: checked })} /></FormRow>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="동영상" {...sectionProps("video")}>
        <div className="space-y-3">
          <FormRow label="유튜브 URL">
            <Input
              value={data.youtubeUrl}
              onChange={(event) => {
                const url = event.target.value;
                const videoId = extractYouTubeVideoId(url);
                onChange({ ...data, youtubeUrl: url, youtubeVideoId: videoId, youtubeError: url && !videoId ? "올바른 YouTube URL을 입력해주세요." : "" });
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </FormRow>
          {data.youtubeError && <p className="pl-[88px] text-[12px] text-[#d8563d]">{data.youtubeError}</p>}
          {youtubePreviewId && <p className="pl-[88px] text-[12px] text-[#777]">영상 ID: {youtubePreviewId}</p>}
        </div>
      </EditorSection>

      <EditorSection title="배경음악" {...sectionProps("music")}>
        <div className="space-y-4">
          {data.audioUrl && <audio src={data.audioUrl} controls className="w-full" />}
          <FormRow label="기본 음원">
            <div className="grid w-[170px] grid-cols-4 gap-2">
              {defaultMusicOptions.map((music) => (
                <Chip key={music} active={data.defaultMusic === music} onClick={() => update("defaultMusic", music)}>{music}</Chip>
              ))}
            </div>
          </FormRow>
          <FormRow label="나의 음원"><UploadBox imageUrl="" type="audio" onSelect={selectFiles} label="MP3 업로드" /></FormRow>
          <FormRow label="자동 재생"><Check label="첫 터치 후 재생" checked={data.audioAutoplay} onChange={(checked) => update("audioAutoplay", checked)} /></FormRow>
          <p className="border-t border-[#efefef] pt-4 text-[12px] text-[#999]">업로드한 음원의 저작권 책임은 사용자에게 있습니다.</p>
        </div>
      </EditorSection>

      <EditorSection title="안내사항" badge="그룹형" {...sectionProps("notice")}>
        <ComingSoon label="안내사항 입력 기능은 다음 단계에서 항목 반복 구조로 확장됩니다." />
      </EditorSection>

      <EditorSection title="참석의사" badge="RSVP" {...sectionProps("rsvp")}>
        <div className="space-y-3">
          <FormRow label="제목"><Input value={data.rsvpTitle} onChange={(event) => update("rsvpTitle", event.target.value)} /></FormRow>
          <FormRow label="내용"><textarea value={data.rsvpDescription} onChange={(event) => update("rsvpDescription", event.target.value)} rows={4} className="w-full rounded border border-[#e1e1e1] px-3 py-2 text-[13px]" /></FormRow>
          <FormRow label="버튼명"><Input value={data.rsvpButtonLabel} onChange={(event) => update("rsvpButtonLabel", event.target.value)} /></FormRow>
          <p className="border-t border-[#efefef] pt-4 text-[12px] text-[#999]">참석의사 결과는 Supabase rsvps 테이블에 저장됩니다.</p>
        </div>
      </EditorSection>

      <EditorSection title="방명록" {...sectionProps("guestbook")}>
        <div className="space-y-3">
          <FormRow label="제목"><Input value={data.guestbookTitle} onChange={(event) => update("guestbookTitle", event.target.value)} /></FormRow>
          <FormRow label="관리자 비밀번호"><Input value={data.guestbookAdminPassword} onChange={(event) => update("guestbookAdminPassword", event.target.value)} placeholder="필요한 경우에만 설정하세요" /></FormRow>
          <p className="border-t border-[#efefef] pt-4 text-[12px] text-[#999]">방명록은 공개 페이지에서 Supabase guestbook 테이블에 저장됩니다.</p>
        </div>
      </EditorSection>

      <EditorSection title="화환 보내기" checked={false} {...sectionProps("flower")}>
        <ComingSoon label="화환 주문 연동은 준비 중입니다. 현재는 공개 페이지에 표시하지 않습니다." />
      </EditorSection>

      <EditorSection title="사진 & 글귀" {...sectionProps("quote")}>
        <div className="space-y-4">
          <FormRow label="사진"><UploadBox imageUrl={data.quoteImage} type="quote" onSelect={selectFiles} /></FormRow>
          <FormRow label="글귀"><textarea value={data.quoteText} onChange={(event) => update("quoteText", event.target.value)} rows={5} className="w-full rounded border border-[#e1e1e1] px-3 py-2 text-[13px]" /></FormRow>
        </div>
      </EditorSection>

      <EditorSection title="카카오톡 공유 썸네일" {...sectionProps("kakaoThumb")}>
        <ThumbFields imageUrl={data.kakaoThumbnailUrl} onSelect={selectFiles} type="kakao_thumbnail" />
      </EditorSection>

      <EditorSection title="URL 공유 썸네일" {...sectionProps("urlThumb")}>
        <ThumbFields imageUrl={data.urlThumbnailUrl} onSelect={selectFiles} type="url_thumbnail" />
      </EditorSection>

      <EditorSection title="메뉴 순서 변경" {...sectionProps("menuOrder")}>
        <div className="w-[304px] border border-[#e5e5e5]">
          {data.menuOrder.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedMenuId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveMenu(item.id)}
              className="flex h-39px h-[39px] cursor-move items-center justify-between border-b border-[#ededed] px-5 text-[13px]"
            >
              <span>{item.label}</span>
              <span className="text-[#aaa]">☰</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] text-[#999]">항목을 드래그하여 순서를 변경할 수 있습니다. 추후 @dnd-kit/sortable로 동일 인터페이스를 교체할 수 있게 state는 menuOrder로 분리했습니다.</p>
      </EditorSection>

      <EditorSection title="QR 코드 생성 방법" {...sectionProps("qr")}>
        <div className="-mx-7 -mb-6 -mt-6 border-t border-[#f1e3b6] bg-[#fff8dc] px-7 py-5 text-[13px] leading-7 text-[#555]">
          <p className="font-semibold text-[#111]">네이버 QR &gt; 코드 생성 &gt; URL 링크 선택 &gt; 청첩장 URL 링크 입력</p>
          <div className="mt-4 border-t border-[#eadfb9] pt-4 text-[12px] text-[#888]">
            <p>ⓘ QR 코드 생성 후에도 청첩장 수정이 가능합니다.</p>
            <p>ⓘ 종이 청첩장 인쇄 후 모바일청첩장 주소를 변경해야 하는 상황에도 대응 가능합니다.</p>
          </div>
        </div>
      </EditorSection>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-[#ddd] bg-[#fafafa] px-4 py-5 text-[13px] leading-6 text-[#777]">준비 중<br />{label}</div>;
}

function ThumbFields({
  imageUrl,
  type,
  onSelect,
}: {
  imageUrl: string;
  type: "kakao_thumbnail" | "url_thumbnail";
  onSelect: (type: ImageUploadType | "audio", files: FileList) => void;
}) {
  return (
    <div className="space-y-4">
      <FormRow label="사진"><UploadBox imageUrl={imageUrl} type={type} onSelect={onSelect} /></FormRow>
      <FormRow label="제목"><Input placeholder="♥ 결혼합니다" /></FormRow>
      <FormRow label="내용"><Input placeholder="5월 18일 오후 1시 30분" /></FormRow>
      <p className="border-t border-[#efefef] pt-4 text-[12px] text-[#999]">공유 썸네일은 공개 페이지 metadata/open graph에 반영할 수 있도록 URL을 저장합니다.</p>
    </div>
  );
}

function FamilyFields({
  side,
  data,
  onChange,
  onPersonChange,
}: {
  side: "groom" | "bride";
  data: InvitationData;
  onChange: (data: InvitationData) => void;
  onPersonChange: (side: "groom" | "bride", lastName: string, firstName: string) => void;
}) {
  const isGroom = side === "groom";
  const lastName = isGroom ? data.groomLastName : data.brideLastName;
  const firstName = isGroom ? data.groomFirstName : data.brideFirstName;

  return (
    <div className="space-y-3">
      <FormRow label="아버님">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="성" className="w-[60px]" />
          <Input placeholder="이름" className="w-[74px]" />
          <Check label="故" checked={false} onChange={() => undefined} />
        </div>
      </FormRow>
      <FormRow label="어머님">
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="성" className="w-[60px]" />
          <Input placeholder="이름" className="w-[74px]" />
          <Check label="故" checked={false} onChange={() => undefined} />
        </div>
      </FormRow>
      <FormRow label={isGroom ? "신랑님" : "신부님"}>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="성" value={lastName} onChange={(event) => onPersonChange(side, event.target.value, firstName)} className="w-[60px]" />
          <Input placeholder="이름" value={firstName} onChange={(event) => onPersonChange(side, lastName, event.target.value)} className="w-[74px]" />
        </div>
      </FormRow>
      <FormRow label="관계">
        <Select value={isGroom ? data.groomRelation : data.brideRelation} onChange={(event) => onChange({ ...data, [isGroom ? "groomRelation" : "brideRelation"]: event.target.value })}>
          <option>{isGroom ? "아들" : "딸"}</option>
          <option>장남</option>
          <option>차남</option>
          <option>장녀</option>
          <option>차녀</option>
        </Select>
      </FormRow>
      <p className="mt-5 border-t border-[#efefef] pt-4 text-[12px] text-[#9a9a9a]">ⓘ 아버님·어머님 성함은 생략할 수 있습니다.</p>
    </div>
  );
}
