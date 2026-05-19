"use client";

import KoreanInvitationPreview from "@/components/KoreanInvitationPreview";
import type { InvitationData } from "@/types/invitation";

type MobileInvitationPreviewProps = {
  data: InvitationData;
  compact?: boolean;
};

export default function MobileInvitationPreview({ data }: MobileInvitationPreviewProps) {
  return <KoreanInvitationPreview data={data} />;
}
