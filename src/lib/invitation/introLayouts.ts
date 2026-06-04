import type { IntroTemplate } from "@/types/invitation";

export type IntroLayoutId = "moment" | "minimal" | "start" | "together" | "goodday";

export type IntroLayoutOption = {
  id: IntroLayoutId;
  mood: string;
  label: string;
  hint: string;
};

export type IntroImageSlotPreset = {
  wrapClassName: string;
  frameClassName: string;
  editorFrameClassName: string;
  placeholder: string;
};

export const INTRO_LAYOUT_OPTIONS: IntroLayoutOption[] = [
  { id: "moment", mood: "모던", label: "모던", hint: "세로 대표 사진" },
  { id: "minimal", mood: "미니멀", label: "미니멀", hint: "넓은 여백" },
  { id: "start", mood: "시작", label: "시작", hint: "이름과 날짜" },
  { id: "together", mood: "동행", label: "동행", hint: "프레임 카드" },
  { id: "goodday", mood: "좋은날", label: "좋은날", hint: "종이 질감" },
];

export const INTRO_IMAGE_SLOT_PRESETS: Record<IntroLayoutId, IntroImageSlotPreset> = {
  moment: {
    wrapClassName: "mt-9",
    frameClassName: "aspect-[3/4] w-full max-w-[310px]",
    editorFrameClassName: "aspect-[3/4] min-h-[260px] max-w-[230px]",
    placeholder: "세로형 대표 사진",
  },
  minimal: {
    wrapClassName: "mt-10",
    frameClassName: "aspect-[4/5] w-full max-w-[292px]",
    editorFrameClassName: "aspect-[4/5] min-h-[230px] max-w-[220px]",
    placeholder: "미니멀 대표 사진",
  },
  start: {
    wrapClassName: "mt-8",
    frameClassName: "aspect-[5/6] w-full max-w-[326px]",
    editorFrameClassName: "aspect-[5/6] min-h-[250px] max-w-[250px]",
    placeholder: "시작 테마 사진",
  },
  together: {
    wrapClassName: "mt-9 rounded-[18px] bg-white/80 p-3 shadow-[0_14px_36px_rgba(80,55,43,0.10)]",
    frameClassName: "aspect-[4/5] w-full max-w-[300px]",
    editorFrameClassName: "aspect-[4/5] min-h-[245px] max-w-[230px] rounded-[14px] bg-white p-2 shadow-[0_10px_24px_rgba(80,55,43,0.10)]",
    placeholder: "프레임 대표 사진",
  },
  goodday: {
    wrapClassName: "mt-8 px-2",
    frameClassName: "aspect-[4/3] w-full max-w-[340px]",
    editorFrameClassName: "aspect-[4/3] min-h-[180px] max-w-[300px]",
    placeholder: "좋은날 대표 사진",
  },
};

export function resolveIntroLayout(value?: string | null): IntroLayoutId {
  const clean = value?.trim() ?? "";
  if (!clean) return "moment";
  if (clean === "moment" || clean === "basicDate" || clean === "basic" || clean.includes("모던") || clean.includes("모먼트") || clean.includes("기본")) return "moment";
  if (clean === "minimal" || clean.includes("미니멀")) return "minimal";
  if (clean === "start" || clean === "photoFirst" || clean.includes("시작") || clean.includes("사진")) return "start";
  if (clean === "together" || clean === "saveTheDate" || clean.includes("동행") || clean.includes("세이브")) return "together";
  if (clean === "goodday" || clean.includes("좋은날")) return "goodday";
  return "moment";
}

export function moodForIntroLayout(layout: IntroLayoutId) {
  return INTRO_LAYOUT_OPTIONS.find((option) => option.id === layout)?.mood ?? "모던";
}

export function asIntroTemplate(layout: IntroLayoutId): IntroTemplate {
  return layout;
}

export function getIntroImageSlotPreset(layout: string | null | undefined) {
  return INTRO_IMAGE_SLOT_PRESETS[resolveIntroLayout(layout)];
}
