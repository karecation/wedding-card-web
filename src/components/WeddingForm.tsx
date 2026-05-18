"use client";

import KoreanInvitationEditor from "@/components/KoreanInvitationEditor";
import type { InvitationData } from "@/types/invitation";

type WeddingFormProps = {
  data: InvitationData;
  isSubmitting?: boolean;
  onChange: (data: InvitationData) => void;
  onPreview: () => void;
};

export default function WeddingForm({ data, isSubmitting = false, onChange, onPreview }: WeddingFormProps) {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onPreview();
      }}
    >
      <KoreanInvitationEditor data={data} isSaving={isSubmitting} onChange={onChange} />
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-10 rounded bg-[#f49a79] px-6 text-[13px] font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "저장중" : "저장하기"}
      </button>
    </form>
  );
}
