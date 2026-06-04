import type { IntroTemplate } from "@/types/invitation";

// ─── Intro layout ────────────────────────────────────────────────────────────

export type IntroLayoutId = "moment" | "minimal" | "start" | "together" | "goodday";

export type IntroLayoutOption = {
  id: IntroLayoutId;
  label: string;
  selectLabel: string;
  badge?: string;
  hint: string;
  mood: string;
};

export type IntroImageSlotPreset = {
  wrapClassName: string;
  frameClassName: string;
  editorFrameClassName: string;
  placeholder: string;
};

export const INTRO_LAYOUT_OPTIONS: IntroLayoutOption[] = [
  {
    id: "moment",
    label: "모먼트",
    selectLabel: "모먼트 NEW",
    badge: "NEW",
    hint: "상단 날짜 + 세로 대표 사진",
    mood: "따뜻한 로즈톤",
  },
  {
    id: "minimal",
    label: "미니멀",
    selectLabel: "미니멀 NEW",
    badge: "NEW",
    hint: "넓은 여백 + 큰 대표 사진",
    mood: "깔끔한 베이지",
  },
  {
    id: "start",
    label: "시작",
    selectLabel: "시작",
    hint: "이름 좌우 + 날짜 중앙",
    mood: "균형 잡힌 시작점",
  },
  {
    id: "together",
    label: "동행",
    selectLabel: "동행",
    hint: "이름 먼저 + 프레임 사진",
    mood: "부드러운 코랄",
  },
  {
    id: "goodday",
    label: "좋은날",
    selectLabel: "좋은날",
    hint: "정보 먼저 + 종이 질감",
    mood: "차분한 초대장",
  },
];

export const INTRO_THEME_CONFIG: Record<IntroLayoutId, IntroLayoutOption & {
  themeColor: string;
  fontFamily: string;
  fontWeight: "light" | "regular" | "medium";
  thumbnailClassName: string;
  thumbnailImageClassName: string;
}> = {
  moment: {
    ...INTRO_LAYOUT_OPTIONS[0],
    themeColor: "#B8896A",
    fontFamily: "gowun-dodum",
    fontWeight: "regular",
    thumbnailClassName: "bg-[#fbf8f5]",
    thumbnailImageClassName: "mx-auto mt-2 h-[58px] w-[42px]",
  },
  minimal: {
    ...INTRO_LAYOUT_OPTIONS[1],
    themeColor: "#8E7464",
    fontFamily: "pretendard",
    fontWeight: "light",
    thumbnailClassName: "bg-[#fffdf9]",
    thumbnailImageClassName: "mx-auto mt-3 h-[55px] w-[50px]",
  },
  start: {
    ...INTRO_LAYOUT_OPTIONS[2],
    themeColor: "#8E7464",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    thumbnailClassName: "bg-white",
    thumbnailImageClassName: "mx-auto mt-2 h-[54px] w-[70px]",
  },
  together: {
    ...INTRO_LAYOUT_OPTIONS[3],
    themeColor: "#C98F8A",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    thumbnailClassName: "bg-[#f7f1ed]",
    thumbnailImageClassName: "mx-auto mt-2 h-[58px] w-[46px] border-[4px] border-white",
  },
  goodday: {
    ...INTRO_LAYOUT_OPTIONS[4],
    themeColor: "#B8896A",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    thumbnailClassName: "bg-[radial-gradient(circle_at_1px_1px,rgba(120,92,72,0.10)_1px,transparent_0)] bg-[length:8px_8px]",
    thumbnailImageClassName: "mx-auto mt-3 h-[46px] w-[72px]",
  },
};

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
    placeholder: "이름강조 대표 사진",
  },
  start: {
    wrapClassName: "mt-8",
    frameClassName: "aspect-[5/6] w-full max-w-[326px]",
    editorFrameClassName: "aspect-[5/6] min-h-[250px] max-w-[250px]",
    placeholder: "날짜강조 사진",
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
    placeholder: "초대문구형 사진",
  },
};

export function resolveIntroLayout(value?: string | null): IntroLayoutId {
  const clean = value?.trim() ?? "";
  if (!clean) return "moment";
  if (
    clean === "moment" ||
    clean === "modern" ||
    clean === "basicDate" ||
    clean === "basic" ||
    clean.includes("모던") ||
    clean.includes("모먼트") ||
    clean.includes("기본") ||
    clean.includes("세로사진")
  )
    return "moment";
  if (clean === "minimal" || clean.includes("미니멀") || clean.includes("이름강조")) return "minimal";
  if (
    clean === "start" ||
    clean === "photoFirst" ||
    clean.includes("시작") ||
    clean.includes("날짜강조") ||
    (clean.includes("사진") && !clean.includes("세로"))
  )
    return "start";
  if (
    clean === "together" ||
    clean === "companion" ||
    clean === "saveTheDate" ||
    clean.includes("동행") ||
    clean.includes("세이브") ||
    clean.includes("프레임")
  )
    return "together";
  if (clean === "goodday" || clean === "good-day" || clean.includes("좋은날") || clean.includes("초대문구")) return "goodday";
  return "moment";
}

export function getIntroImageSlotPreset(layout: string | null | undefined) {
  return INTRO_IMAGE_SLOT_PRESETS[resolveIntroLayout(layout)];
}

export function getIntroThemeConfig(layout: string | null | undefined) {
  return INTRO_THEME_CONFIG[resolveIntroLayout(layout)];
}

export function asIntroTemplate(layout: IntroLayoutId): IntroTemplate {
  return layout;
}

// ─── Theme presets (독립적으로 관리) ─────────────────────────────────────────

export type ThemeId = "modern" | "minimal" | "natural" | "romantic" | "classic";

export type ThemePreset = {
  id: ThemeId;
  label: string;
  themeColor: string;
  fontFamily: string;
  fontWeight: "light" | "regular" | "medium";
  hint: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "modern",
    label: "모던",
    themeColor: "#B8896A",
    fontFamily: "gowun-dodum",
    fontWeight: "regular",
    hint: "따뜻한 로즈톤",
  },
  {
    id: "minimal",
    label: "미니멀",
    themeColor: "#8E7464",
    fontFamily: "pretendard",
    fontWeight: "light",
    hint: "깔끔한 베이지",
  },
  {
    id: "natural",
    label: "내추럴",
    themeColor: "#8F9A8B",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    hint: "자연스러운 그레이",
  },
  {
    id: "romantic",
    label: "로맨틱",
    themeColor: "#C98F8A",
    fontFamily: "nanum-myeongjo",
    fontWeight: "light",
    hint: "부드러운 핑크",
  },
  {
    id: "classic",
    label: "클래식",
    themeColor: "#3A2F2A",
    fontFamily: "noto-serif",
    fontWeight: "regular",
    hint: "고급스러운 다크",
  },
];

export function resolveThemeId(value?: string | null): ThemeId {
  const clean = (value ?? "").trim();
  const byId = THEME_PRESETS.find((t) => t.id === clean);
  if (byId) return byId.id;
  const byLabel = THEME_PRESETS.find((t) => t.label === clean);
  if (byLabel) return byLabel.id;
  // backward-compat: old Korean mood names
  if (clean.includes("모던") || clean.includes("modern")) return "modern";
  if (clean.includes("미니멀") || clean.includes("minimal")) return "minimal";
  if (clean.includes("내추럴") || clean.includes("natural")) return "natural";
  if (clean.includes("로맨틱") || clean.includes("romantic")) return "romantic";
  if (clean.includes("클래식") || clean.includes("classic")) return "classic";
  return "modern";
}

export function getThemePreset(themeIdOrLabel?: string | null): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === themeIdOrLabel || t.label === themeIdOrLabel) ?? THEME_PRESETS[0];
}

/** @deprecated 하위 호환용 — theme과 intro layout 분리 이전에 사용되던 함수 */
export function moodForIntroLayout(layout: IntroLayoutId): string {
  // 레이아웃 ID → 기존 mood 이름 매핑 (old data 역직렬화 용도)
  const map: Record<IntroLayoutId, string> = {
    moment: "모던",
    minimal: "미니멀",
    start: "시작",
    together: "동행",
    goodday: "좋은날",
  };
  return map[layout] ?? "모던";
}
