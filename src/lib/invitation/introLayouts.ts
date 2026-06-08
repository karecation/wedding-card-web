import type { IntroBackgroundTemplate, IntroTemplate } from "@/types/invitation";

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

export type IntroBackgroundTemplateOption = {
  id: IntroBackgroundTemplate;
  label: string;
  hint: string;
  editable: boolean;
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
    themeColor: "champagne",
    fontFamily: "gowun-dodum",
    fontWeight: "regular",
    thumbnailClassName: "bg-[#fbf8f5]",
    thumbnailImageClassName: "mx-auto mt-2 h-[58px] w-[42px]",
  },
  minimal: {
    ...INTRO_LAYOUT_OPTIONS[1],
    themeColor: "mocha",
    fontFamily: "pretendard",
    fontWeight: "light",
    thumbnailClassName: "bg-[#fffdf9]",
    thumbnailImageClassName: "mx-auto mt-3 h-[55px] w-[50px]",
  },
  start: {
    ...INTRO_LAYOUT_OPTIONS[2],
    themeColor: "ink-brown",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    thumbnailClassName: "bg-white",
    thumbnailImageClassName: "mx-auto mt-2 h-[54px] w-[70px]",
  },
  together: {
    ...INTRO_LAYOUT_OPTIONS[3],
    themeColor: "dusty-rose",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    thumbnailClassName: "bg-[#f7f1ed]",
    thumbnailImageClassName: "mx-auto mt-2 h-[58px] w-[46px] border-[4px] border-white",
  },
  goodday: {
    ...INTRO_LAYOUT_OPTIONS[4],
    themeColor: "champagne",
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

export const INTRO_BACKGROUND_TEMPLATES: IntroBackgroundTemplateOption[] = [
  { id: "date-card", label: "날짜 상단", hint: "날짜와 이름을 정돈한 기본형", editable: true },
  { id: "names-top", label: "이름 상단", hint: "이름과 문구를 먼저 보여주는 형", editable: true },
  { id: "slash-date", label: "슬래시 날짜", hint: "이름 사이 날짜를 강조", editable: true },
  { id: "wedding-of", label: "웨딩 오브", hint: "영문 타이틀과 스크립트 문구", editable: true },
  { id: "framed-date", label: "액자형", hint: "사진 아래 정보를 카드처럼 배치", editable: true },
  { id: "script-bottom", label: "스크립트", hint: "사진 아래 필기체 문구 강조", editable: true },
  { id: "yellow-script", label: "옐로 타이포", hint: "노란 필기체 문구 애니메이션", editable: true },
  { id: "blank-photo", label: "빈 사진", hint: "사진만 크게 사용하는 업로드형", editable: false },
];

export function resolveIntroBackgroundTemplate(value?: string | null): IntroBackgroundTemplate {
  const clean = (value ?? "").trim();
  const byId = INTRO_BACKGROUND_TEMPLATES.find((template) => template.id === clean);
  if (byId) return byId.id;
  if (clean === "basicDate" || clean === "moment" || clean.includes("날짜")) return "date-card";
  if (clean.includes("이름")) return "names-top";
  if (clean.includes("slash") || clean.includes("슬래시")) return "slash-date";
  if (clean.includes("wedding")) return "wedding-of";
  if (clean.includes("frame") || clean.includes("액자")) return "framed-date";
  if (clean.includes("script") || clean.includes("스크립트")) return "script-bottom";
  if (clean.includes("yellow") || clean.includes("옐로")) return "yellow-script";
  if (clean.includes("blank") || clean.includes("빈")) return "blank-photo";
  return "date-card";
}

export function getIntroBackgroundTemplate(value?: string | null) {
  const id = resolveIntroBackgroundTemplate(value);
  return INTRO_BACKGROUND_TEMPLATES.find((template) => template.id === id) ?? INTRO_BACKGROUND_TEMPLATES[0];
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
    themeColor: "champagne",
    fontFamily: "gowun-dodum",
    fontWeight: "regular",
    hint: "따뜻한 로즈톤",
  },
  {
    id: "minimal",
    label: "미니멀",
    themeColor: "mocha",
    fontFamily: "pretendard",
    fontWeight: "light",
    hint: "깔끔한 베이지",
  },
  {
    id: "natural",
    label: "내추럴",
    themeColor: "sage",
    fontFamily: "gowun-batang",
    fontWeight: "regular",
    hint: "자연스러운 그레이",
  },
  {
    id: "romantic",
    label: "로맨틱",
    themeColor: "dusty-rose",
    fontFamily: "nanum-myeongjo",
    fontWeight: "light",
    hint: "부드러운 핑크",
  },
  {
    id: "classic",
    label: "클래식",
    themeColor: "ink-brown",
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
