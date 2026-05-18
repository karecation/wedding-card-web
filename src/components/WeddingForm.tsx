"use client";

import GalleryUploader from "@/components/GalleryUploader";
import ImageUploader from "@/components/ImageUploader";
import TemplateSelector from "@/components/TemplateSelector";
import type { InvitationData } from "@/types/invitation";

type WeddingFormProps = {
  data: InvitationData;
  onChange: (data: InvitationData) => void;
  onPreview: () => void;
};

type TextFieldKey = Exclude<keyof InvitationData, "coverImage" | "galleryImages" | "templateMood">;

type Field = {
  key: TextFieldKey;
  label: string;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
};

const detailFields: Field[] = [
  { key: "groomName", label: "신랑 이름", placeholder: "김도윤" },
  { key: "brideName", label: "신부 이름", placeholder: "이서연" },
  {
    key: "message",
    label: "초대 문구",
    placeholder: "서로의 계절이 되어 오래도록 함께 걸어가려 합니다. 소중한 걸음으로 축복해 주세요.",
    multiline: true,
  },
  { key: "weddingDate", label: "예식 날짜", type: "date" },
  { key: "weddingTime", label: "예식 시간", type: "time" },
  { key: "venueName", label: "예식장 이름", placeholder: "라움 아트센터 2층 마제스틱볼룸" },
  { key: "venueAddress", label: "예식장 주소", placeholder: "서울 강남구 언주로 564" },
  { key: "mapLink", label: "지도 링크", type: "url", placeholder: "https://map.naver.com/..." },
  { key: "groomAccount", label: "신랑측 계좌번호", placeholder: "국민 000000-00-000000 김도윤" },
  { key: "brideAccount", label: "신부측 계좌번호", placeholder: "신한 000-000-000000 이서연" },
  { key: "musicUrl", label: "배경음악 URL", type: "url", placeholder: "https://..." },
];

const fieldGroups = [
  {
    id: "step-3",
    title: "예식 기본 정보",
    fields: ["groomName", "brideName", "message", "weddingDate", "weddingTime"] satisfies TextFieldKey[],
  },
  {
    id: "step-4",
    title: "오시는 길",
    fields: ["venueName", "venueAddress", "mapLink"] satisfies TextFieldKey[],
  },
  {
    id: "step-5",
    title: "마음 전하실 곳",
    fields: ["groomAccount", "brideAccount"] satisfies TextFieldKey[],
  },
  {
    id: "step-6",
    title: "배경음악",
    fields: ["musicUrl"] satisfies TextFieldKey[],
  },
];

export default function WeddingForm({ data, onChange, onPreview }: WeddingFormProps) {
  const updateField = (key: TextFieldKey, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        onPreview();
      }}
    >
      <div id="step-1" className="rounded-lg border border-[#e3d5bf] bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(72,57,40,0.08)] sm:p-7">
        <div className="mb-5 flex items-center justify-between border-b border-[#eadfce] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a7b4f]">Step 01</p>
            <h3 className="mt-1 text-xl font-semibold">대표 사진</h3>
          </div>
        </div>
        <ImageUploader image={data.coverImage} onChange={(coverImage) => onChange({ ...data, coverImage })} />
      </div>

      <div className="rounded-lg border border-[#e3d5bf] bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(72,57,40,0.08)] sm:p-7">
        <div className="mb-5 flex items-center justify-between border-b border-[#eadfce] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a7b4f]">Step 02</p>
            <h3 className="mt-1 text-xl font-semibold">갤러리 사진</h3>
          </div>
        </div>
        <GalleryUploader
          images={data.galleryImages}
          onChange={(galleryImages) => onChange({ ...data, galleryImages })}
        />
      </div>

      <div id="step-2" className="rounded-lg border border-[#e3d5bf] bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(72,57,40,0.08)] sm:p-7">
        <div className="mb-5 flex items-center justify-between border-b border-[#eadfce] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#9a7b4f]">Template</p>
            <h3 className="mt-1 text-xl font-semibold">디자인 분위기</h3>
          </div>
        </div>
        <TemplateSelector
          value={data.templateMood}
          onChange={(templateMood) => onChange({ ...data, templateMood })}
        />
      </div>

      {fieldGroups.map((group, groupIndex) => (
        <div
          key={group.id}
          id={group.id}
          className="rounded-lg border border-[#e3d5bf] bg-[#fffaf2] p-5 shadow-[0_18px_50px_rgba(72,57,40,0.08)] sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between border-b border-[#eadfce] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#9a7b4f]">
                Step {String(groupIndex + 3).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{group.title}</h3>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((fieldKey) => {
              const field = detailFields.find((item) => item.key === fieldKey);
              if (!field) return null;

              return (
                <label
                  key={field.key}
                  className={`space-y-2 ${field.multiline || field.key === "venueAddress" || field.key === "mapLink" || field.key === "musicUrl" ? "sm:col-span-2" : ""}`}
                >
                  <span className="text-sm font-medium text-[#4c433b]">{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      value={data[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={5}
                      className="w-full rounded-lg border border-[#ded0ba] bg-[#fffdf8] px-4 py-3 text-sm leading-6 text-[#2d2926] outline-none transition placeholder:text-[#a99a85] focus:border-[#9a7b4f] focus:ring-4 focus:ring-[#e7d3ad]/30"
                    />
                  ) : (
                    <input
                      value={data[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      type={field.type ?? "text"}
                      className="h-12 w-full rounded-lg border border-[#ded0ba] bg-[#fffdf8] px-4 text-sm text-[#2d2926] outline-none transition placeholder:text-[#a99a85] focus:border-[#9a7b4f] focus:ring-4 focus:ring-[#e7d3ad]/30"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="submit"
        className="min-h-14 w-full rounded-full bg-[#2d2926] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#fbf7ef] shadow-[0_18px_45px_rgba(45,41,38,0.18)] transition hover:bg-[#4a4038]"
      >
        청첩장 크게 미리보기
      </button>
    </form>
  );
}
