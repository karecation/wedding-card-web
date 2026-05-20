"use server";

import { getSafeStoragePath } from "@/lib/images/safeStoragePath";
import { createSupabaseAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/server";
import type { UploadResult } from "@/lib/upload";
import type { InvitationData, SavedInvitation } from "@/types/invitation";

function toDbPayload(invitation: SavedInvitation) {
  return {
    id: invitation.id,
    slug: invitation.slug,
    title: `${invitation.groomName} ${invitation.brideName} 모바일 청첩장`,
    theme: {
      templateMood: invitation.templateMood,
      themeColor: invitation.themeColor,
      fontFamily: invitation.fontFamily,
      fontWeight: invitation.fontWeight,
      introShape: invitation.introShape,
    },
    groom: {
      name: invitation.groomName,
      lastName: invitation.groomLastName,
      firstName: invitation.groomFirstName,
      relation: invitation.groomRelation,
      fatherLastName: invitation.groomFatherLastName,
      fatherName: invitation.groomFatherName,
      motherLastName: invitation.groomMotherLastName,
      motherName: invitation.groomMotherName,
    },
    bride: {
      name: invitation.brideName,
      lastName: invitation.brideLastName,
      firstName: invitation.brideFirstName,
      relation: invitation.brideRelation,
      fatherLastName: invitation.brideFatherLastName,
      fatherName: invitation.brideFatherName,
      motherLastName: invitation.brideMotherLastName,
      motherName: invitation.brideMotherName,
    },
    greeting: {
      title: invitation.messageTitle,
      message: invitation.message,
      quoteText: invitation.quoteText,
      quoteImage: invitation.quoteImage,
    },
    wedding_date: invitation.weddingDate || null,
    wedding_time: `${invitation.weddingPeriod} ${invitation.weddingHour} ${invitation.weddingMinute}`,
    venue: {
      title: invitation.venueTitle,
      name: invitation.venueName,
      hall: invitation.venueHall,
      address: invitation.venueAddress,
      latitude: invitation.latitude,
      longitude: invitation.longitude,
      mapLink: invitation.mapLink,
      showMap: invitation.showMap,
      lockMap: invitation.lockMap,
    },
    transportation: invitation.transports,
    menu_order: invitation.menuOrder,
    settings: invitation,
    kakao_thumbnail_url: invitation.kakaoThumbnailUrl || null,
    url_thumbnail_url: invitation.urlThumbnailUrl || null,
    main_image_url: invitation.coverImage || null,
    is_published: invitation.isPublished,
    updated_at: new Date().toISOString(),
  };
}

function fromDbPayload(row: Record<string, unknown>): SavedInvitation {
  const settings = (row.settings ?? {}) as InvitationData;
  return {
    ...settings,
    id: String(row.id),
    slug: String(row.slug),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function syncRelatedTables(invitation: SavedInvitation) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("invitation_images").delete().eq("invitation_id", invitation.id);
  const imageRows = [
    invitation.coverImage && { invitation_id: invitation.id, type: "main", url: invitation.coverImage, sort_order: 0 },
    invitation.introImage && { invitation_id: invitation.id, type: "intro", url: invitation.introImage, sort_order: 1 },
    invitation.quoteImage && { invitation_id: invitation.id, type: "quote", url: invitation.quoteImage, sort_order: 2 },
    invitation.kakaoThumbnailUrl && { invitation_id: invitation.id, type: "kakao_thumbnail", url: invitation.kakaoThumbnailUrl, sort_order: 3 },
    invitation.urlThumbnailUrl && { invitation_id: invitation.id, type: "url_thumbnail", url: invitation.urlThumbnailUrl, sort_order: 4 },
    ...invitation.galleryItems.map((image, index) => ({
      invitation_id: invitation.id,
      type: "gallery",
      url: image.url || image.previewUrl,
      sort_order: index,
      caption: image.caption ?? "",
    })).filter((image) => image.url),
  ].filter(Boolean);
  if (imageRows.length > 0) await supabase.from("invitation_images").insert(imageRows);

  await supabase.from("invitation_audio").delete().eq("invitation_id", invitation.id);
  if (invitation.audioUrl || invitation.youtubeUrl) {
    await supabase.from("invitation_audio").insert({
      invitation_id: invitation.id,
      type: invitation.audioUrl ? "background" : "youtube",
      url: invitation.audioUrl || null,
      youtube_url: invitation.youtubeUrl || null,
      title: invitation.audioTitle || null,
      autoplay: invitation.audioAutoplay,
    });
  }

  await supabase.from("bank_accounts").delete().eq("invitation_id", invitation.id);
  if (invitation.bankAccounts.length > 0) {
    await supabase.from("bank_accounts").insert(
      invitation.bankAccounts.map((account, index) => ({
        invitation_id: invitation.id,
        side: account.side,
        group_name: account.groupName,
        bank_name: account.bankName,
        account_number: account.accountNumber,
        account_holder: account.accountHolder,
        kakao_pay_enabled: account.kakaoPayEnabled,
        hidden: account.hidden,
        sort_order: index,
      })),
    );
  }

  await supabase.from("contacts").delete().eq("invitation_id", invitation.id);
  const contacts = invitation.contacts.filter((contact) => contact.phone || contact.name);
  if (contacts.length > 0) {
    await supabase.from("contacts").insert(
      contacts.map((contact, index) => ({
        invitation_id: invitation.id,
        role: contact.role,
        name: contact.name,
        phone: contact.phone,
        sort_order: index,
      })),
    );
  }
}

export async function saveInvitationAction(invitation: SavedInvitation) {
  if (!hasSupabaseServerConfig()) {
    return { invitation, source: "local" as const };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invitations")
    .upsert(toDbPayload(invitation), { onConflict: "slug" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "청첩장 저장에 실패했습니다.");
  }

  const savedInvitation = fromDbPayload(data);
  await syncRelatedTables(savedInvitation);

  return { invitation: savedInvitation, source: "supabase" as const };
}

export async function uploadInvitationFileAction(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  const id = String(formData.get("id") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  const type = String(formData.get("type") ?? "") as UploadResult["type"];

  if (!(file instanceof File)) {
    throw new Error("업로드할 파일이 없습니다.");
  }

  if (!id || !invitationId || !type) {
    throw new Error("업로드 정보가 올바르지 않습니다.");
  }

  if (!hasSupabaseServerConfig()) {
    return { id, type, publicUrl: "" };
  }

  const supabase = createSupabaseAdminClient();
  const bucket = type === "audio" ? "invitation-audio" : "invitation-images";

  // 원본 파일명/slug 대신 UUID 기반 safe path 사용 (한글·공백·특수문자 방지)
  const path = getSafeStoragePath({ invitationId, type, imageId: id, mimeType: file.type });

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    console.error("[uploadInvitationFileAction] 업로드 실패", {
      bucket,
      path,
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorMessage: error.message,
    });
    throw new Error("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return { id, type, publicUrl: data.publicUrl };
}

export async function getInvitationBySlugAction(slug: string) {
  if (!hasSupabaseServerConfig()) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("invitations").select("*").eq("slug", slug).maybeSingle();

  if (error || !data) return null;
  return fromDbPayload(data);
}

export async function submitRsvpAction(invitationId: string, form: Record<string, unknown>) {
  if (!hasSupabaseServerConfig()) return { ok: true, source: "local" as const };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("rsvps").insert({ invitation_id: invitationId, ...form });
  if (error) throw new Error(error.message || "참석 의사 저장에 실패했습니다.");
  return { ok: true, source: "supabase" as const };
}

export async function addGuestbookAction(invitationId: string, form: Record<string, unknown>) {
  if (!hasSupabaseServerConfig()) return { ok: true, source: "local" as const };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("guestbook").insert({ invitation_id: invitationId, ...form });
  if (error) throw new Error(error.message || "방명록 저장에 실패했습니다.");
  return { ok: true, source: "supabase" as const };
}
