"use client";

import type { TemplateMood } from "@/types/invitation";

const templates: TemplateMood[] = ["모던 NEW", "고운고딕", "클래식", "로맨틱", "내추럴"];

type TemplateSelectorProps = {
  value: TemplateMood;
  onChange: (value: TemplateMood) => void;
};

export default function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-[#333]">디자인 분위기</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TemplateMood)}
        className="h-9 w-full rounded border border-[#ddd] bg-white px-3 text-[13px]"
      >
        {templates.map((template) => (
          <option key={template}>{template}</option>
        ))}
      </select>
    </div>
  );
}
