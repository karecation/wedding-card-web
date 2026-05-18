"use client";

import type { TemplateMood } from "@/types/invitation";

const templates: Array<{
  value: TemplateMood;
  description: string;
  swatches: string[];
}> = [
  {
    value: "클래식",
    description: "아이보리와 샴페인",
    swatches: ["#fbf7ef", "#d9c29f", "#2d2926"],
  },
  {
    value: "로맨틱",
    description: "블러시와 라즈베리 포인트",
    swatches: ["#fff1ee", "#d8a0a7", "#6d2f3c"],
  },
  {
    value: "모던",
    description: "프렌치 블루와 차콜",
    swatches: ["#f5f1e8", "#9eb1bf", "#2d2926"],
  },
  {
    value: "럭셔리",
    description: "플럼과 웜 골드",
    swatches: ["#f8f1e4", "#6b4158", "#c2a15f"],
  },
  {
    value: "내추럴",
    description: "세이지와 따뜻한 베이지",
    swatches: ["#f4f0e6", "#9aa88f", "#c9b895"],
  },
];

type TemplateSelectorProps = {
  value: TemplateMood;
  onChange: (value: TemplateMood) => void;
};

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#4c433b]">디자인 분위기</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.value}
            type="button"
            onClick={() => onChange(template.value)}
            className={`min-h-20 rounded-lg border px-4 py-3 text-left transition ${
              value === template.value
                ? "border-[#2d2926] bg-[#2d2926] text-[#fbf7ef]"
                : "border-[#ded0ba] bg-[#fffdf8] text-[#5f554b] hover:border-[#9a7b4f]"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold">{template.value}</span>
                <span className={`mt-1 block text-xs ${value === template.value ? "text-[#eadfce]" : "text-[#756a5c]"}`}>
                  {template.description}
                </span>
              </span>
              <span className="flex shrink-0 overflow-hidden rounded-full border border-white/50">
                {template.swatches.map((swatch) => (
                  <span key={swatch} className="size-5" style={{ backgroundColor: swatch }} />
                ))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
