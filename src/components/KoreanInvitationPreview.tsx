"use client";

import InvitationRenderer from "@/components/invitation/InvitationRenderer";
import type { InvitationData } from "@/types/invitation";

type Props = {
  data: InvitationData;
};

export default function KoreanInvitationPreview({ data }: Props) {
  return <InvitationRenderer invitation={data} mode="preview" />;
}
