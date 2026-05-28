"use server";

import { getSafeStoragePath } from "@/lib/images/safeStoragePath";
import { normalizeUploadType } from "@/lib/images/uploadType";
import { createSupabaseAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/server";
import type { UploadResult } from "@/lib/upload";
import type { InvitationData, SavedInvitation } from "@/types/invitation";

function toDbPayload(invitation: SavedInvitation) {
  const location = invitation.location ?? {
    venueName: invitation.venueName,
    hallName: invitation.venueHall,
    address: invitation.venueAddress,
    lat: invitation.latitude ?? undefined,
    lng: invitation.longitude ?? undefined,
  };

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
      name: location.venueName || invitation.venueName,
      hall: location.hallName || invitation.venueHall,
      address: location.address || invitation.venueAddress,
      latitude: location.lat ?? invitation.latitude,
      longitude: location.lng ?? invitation.longitude,
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

  const { error: imgDeleteErr } = await supabase.from("invitation_images").delete().eq("invitation_id", invitation.id);
  if (imgDeleteErr) console.error("[syncRelatedTables] invitation_images delete failed", { message: imgDeleteErr.message });

  const galleryRows = (invitation.galleryItems ?? [])
    .map((image, index) => ({
      invitation_id: invitation.id,
      type: "gallery",
      url: image.url || image.previewUrl,
      sort_order: index,
      caption: image.caption ?? "",
    }))
    .filter((row) => row.url && row.url.startsWith("https://"));

  const imageRows = [
    invitation.coverImage?.startsWith("https://") && { invitation_id: invitation.id, type: "main", url: invitation.coverImage, sort_order: 0 },
    invitation.introImage?.startsWith("https://") && { invitation_id: invitation.id, type: "intro", url: invitation.introImage, sort_order: 1 },
    invitation.quoteImage?.startsWith("https://") && { invitation_id: invitation.id, type: "photo-quote", url: invitation.quoteImage, sort_order: 2 },
    invitation.kakaoThumbnailUrl?.startsWith("https://") && { invitation_id: invitation.id, type: "share", url: invitation.kakaoThumbnailUrl, sort_order: 3, caption: "kakao" },
    invitation.urlThumbnailUrl?.startsWith("https://") && { invitation_id: invitation.id, type: "share", url: invitation.urlThumbnailUrl, sort_order: 4, caption: "url" },
    ...galleryRows,
  ].filter(Boolean);

  console.log("[Invitation images insert rows]", {
    invitationId: invitation.id,
    totalRows: imageRows.length,
    galleryRows: galleryRows.length,
    typesBreakdown: imageRows.reduce<Record<string, number>>((acc, row) => {
      const r = row as { type?: string };
      const t = r.type ?? "unknown";
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {}),
    galleryItemsInInvitation: invitation.galleryItems?.length ?? 0,
    galleryItemsWithHttps: (invitation.galleryItems ?? []).filter((img) => img.url?.startsWith("https://")).length,
  });

  if (imageRows.length > 0) {
    const { error: imgInsertErr } = await supabase.from("invitation_images").insert(imageRows);
    if (imgInsertErr) {
      console.error("[syncRelatedTables] invitation_images insert failed", {
        message: imgInsertErr.message,
        totalRows: imageRows.length,
        galleryRows: galleryRows.length,
      });
    } else {
      console.log("[Invitation images table insert success]", {
        totalRows: imageRows.length,
        galleryRows: galleryRows.length,
      });
    }
  } else {
    console.warn("[Invitation images insert skipped]", {
      reason: "no rows to insert — gallery URLs are not https or images are empty",
      invitationId: invitation.id,
    });
  }

  const { error: audioDeleteErr } = await supabase.from("invitation_audio").delete().eq("invitation_id", invitation.id);
  if (audioDeleteErr) console.error("[syncRelatedTables] invitation_audio delete failed", { message: audioDeleteErr.message });

  if (invitation.audioUrl || invitation.youtubeUrl) {
    const { error: audioInsertErr } = await supabase.from("invitation_audio").insert({
      invitation_id: invitation.id,
      type: invitation.audioUrl ? "background" : "youtube",
      url: invitation.audioUrl || null,
      youtube_url: invitation.youtubeUrl || null,
      title: invitation.audioTitle || null,
      autoplay: invitation.audioAutoplay,
    });
    if (audioInsertErr) console.error("[syncRelatedTables] invitation_audio insert failed", { message: audioInsertErr.message });
  }

  const { error: bankDeleteErr } = await supabase.from("bank_accounts").delete().eq("invitation_id", invitation.id);
  if (bankDeleteErr) console.error("[syncRelatedTables] bank_accounts delete failed", { message: bankDeleteErr.message });

  if (invitation.bankAccounts.length > 0) {
    const { error: bankInsertErr } = await supabase.from("bank_accounts").insert(
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
    if (bankInsertErr) console.error("[syncRelatedTables] bank_accounts insert failed", { message: bankInsertErr.message });
  }

  const { error: contactDeleteErr } = await supabase.from("contacts").delete().eq("invitation_id", invitation.id);
  if (contactDeleteErr) console.error("[syncRelatedTables] contacts delete failed", { message: contactDeleteErr.message });

  const contacts = invitation.contacts.filter((contact) => contact.phone || contact.name);
  if (contacts.length > 0) {
    const { error: contactInsertErr } = await supabase.from("contacts").insert(
      contacts.map((contact, index) => ({
        invitation_id: invitation.id,
        role: contact.role,
        name: contact.name,
        phone: contact.phone,
        sort_order: index,
      })),
    );
    if (contactInsertErr) console.error("[syncRelatedTables] contacts insert failed", { message: contactInsertErr.message });
  }
}

export async function saveInvitationAction(invitation: SavedInvitation) {
  if (!hasSupabaseServerConfig()) {
    console.warn("[saveInvitationAction] Supabase 미설정 — localStorage 전용 모드로 저장합니다.");
    return { invitation, source: "local" as const };
  }

  console.log("[saveInvitationAction] DB 저장 시작", {
    id: invitation.id,
    slug: invitation.slug,
    coverImage: invitation.coverImage ? (invitation.coverImage.startsWith("https://") ? "https" : invitation.coverImage.startsWith("data:") ? "base64" : "other") : "없음",
    galleryCount: invitation.galleryItems?.length ?? 0,
    galleryUrlSamples: (invitation.galleryItems ?? []).slice(0, 3).map((img) => ({
      id: img.id,
      urlPrefix: img.url?.slice(0, 30),
    })),
  });

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
  const rawType = String(formData.get("type") ?? "");
  const type = normalizeUploadType(rawType) as UploadResult["type"];

  if (!(file instanceof File)) {
    throw new Error("업로드할 파일이 없습니다.");
  }

  if (!id || !invitationId || !type) {
    throw new Error("업로드 정보가 올바르지 않습니다.");
  }

  if (!hasSupabaseServerConfig()) {
    console.warn("[uploadInvitationFileAction] Supabase 미설정 — base64 fallback 사용", { id, rawType, type, fileName: file.name });
    return { id, type, publicUrl: "" };
  }

  const supabase = createSupabaseAdminClient();
  const bucket = type === "audio" ? "invitation-audio" : "invitation-images";

  // 원본 파일명/slug 대신 UUID 기반 safe path 사용 (한글·공백·특수문자 방지)
  const path = getSafeStoragePath({ invitationId, type, imageId: id, mimeType: file.type });

  console.log("[Storage upload start]", { rawType, type, path, fileType: file.type, fileSize: file.size });

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

  console.log("[uploadInvitationFileAction] 업로드 성공", {
    id,
    type,
    bucket,
    path,
    publicUrl: data.publicUrl,
  });

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

export type InvitationImageRow = {
  id: string;
  type: string;
  url: string;
  sort_order: number;
  caption: string;
};

export async function getInvitationByIdAction(invitationId: string): Promise<SavedInvitation | null> {
  if (!hasSupabaseServerConfig() || !invitationId) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("invitations").select("*").eq("id", invitationId).maybeSingle();
  if (error) {
    console.warn("[getInvitationByIdAction] failed", { message: error.message, invitationId });
    return null;
  }
  if (!data) return null;
  return fromDbPayload(data);
}

export async function getInvitationImagesAction(invitationId: string): Promise<InvitationImageRow[]> {
  if (!hasSupabaseServerConfig() || !invitationId) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invitation_images")
    .select("id, type, url, sort_order, caption")
    .eq("invitation_id", invitationId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[getInvitationImagesAction] failed", { message: error.message });
    return [];
  }
  return (data ?? []) as InvitationImageRow[];
}
