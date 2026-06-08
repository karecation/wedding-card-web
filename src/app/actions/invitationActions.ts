"use server";

import { getSafeStoragePath } from "@/lib/images/safeStoragePath";
import { normalizeUploadType } from "@/lib/images/uploadType";
import { createSupabaseAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/server";
import type { UploadResult } from "@/lib/upload";
import type { InvitationData, SavedInvitation } from "@/types/invitation";

const DB_TIMEOUT_MS = 2500;

export type InvitationHistoryItem = {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  hallName: string;
  updatedAt: string;
  isPublished: boolean;
};

export type InvitationImageRow = {
  id: string;
  type: string;
  url: string;
  sort_order: number;
  caption: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getDbConfigState() {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceKey: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

function dbConfigMissing() {
  const missing = !hasSupabaseServerConfig();
  if (missing) console.error("[DB_CONFIG_MISSING]", getDbConfigState());
  return missing;
}

async function withDbTimeout<T>(operation: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS);
  });

  try {
    return await Promise.race([Promise.resolve(operation), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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
    wedding_time: invitation.weddingTime || `${invitation.weddingPeriod} ${invitation.weddingHour} ${invitation.weddingMinute}`,
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
    main_image_url: invitation.coverImage || invitation.introImage || null,
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

function toHistoryItem(row: Record<string, unknown>): InvitationHistoryItem {
  const settings = asRecord(row.settings);
  const location = asRecord(settings.location);
  const venue = asRecord(row.venue);

  return {
    id: String(row.id),
    slug: String(row.slug),
    groomName: asString(settings.groomName, "신랑"),
    brideName: asString(settings.brideName, "신부"),
    weddingDate: asString(settings.weddingDate) || asString(row.wedding_date),
    weddingTime: asString(settings.weddingTime) || asString(row.wedding_time),
    venueName: asString(location.venueName) || asString(settings.venueName) || asString(venue.name),
    hallName: asString(location.hallName) || asString(settings.venueHall) || asString(venue.hall),
    updatedAt: asString(row.updated_at),
    isPublished: Boolean(row.is_published),
  };
}

export async function listInvitationHistoryAction(sessionId?: string): Promise<InvitationHistoryItem[]> {
  console.log("[History load start]");
  if (dbConfigMissing()) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await withDbTimeout(
      supabase
        .from("invitations")
        .select("id, slug, settings, wedding_date, wedding_time, venue, updated_at, is_published")
        .order("updated_at", { ascending: false })
        .limit(100),
      "listInvitationHistoryAction",
    );

    if (error) {
      console.warn("[History load failed]", { error: error.message });
      return [];
    }

    const items = (data ?? [])
      .filter((row) => {
        if (!sessionId) return true;
        const settings = asRecord((row as Record<string, unknown>).settings);
        const savedSessionId = asString(settings.sessionId);
        return !savedSessionId || savedSessionId === sessionId;
      })
      .map((row) => toHistoryItem(row as Record<string, unknown>));
    console.log("[History invitations loaded]", { count: items.length });
    return items;
  } catch (error) {
    console.warn("[History load failed]", { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

async function syncRelatedTables(invitation: SavedInvitation) {
  if (dbConfigMissing()) return;

  try {
    const supabase = createSupabaseAdminClient();

    const { error: imgDeleteErr } = await withDbTimeout(
      supabase.from("invitation_images").delete().eq("invitation_id", invitation.id),
      "invitation_images.delete",
    );
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

    if (imageRows.length > 0) {
      const { error: imgInsertErr } = await withDbTimeout(
        supabase.from("invitation_images").insert(imageRows),
        "invitation_images.insert",
      );
      if (imgInsertErr) console.error("[syncRelatedTables] invitation_images insert failed", { message: imgInsertErr.message });
      else console.log("[Invitation image rows insert success]", { count: imageRows.length });
    }

    await withDbTimeout(supabase.from("invitation_audio").delete().eq("invitation_id", invitation.id), "invitation_audio.delete");
    if (invitation.audioUrl || invitation.youtubeUrl) {
      const { error: audioInsertErr } = await withDbTimeout(
        supabase.from("invitation_audio").insert({
          invitation_id: invitation.id,
          type: invitation.audioUrl ? "background" : "youtube",
          url: invitation.audioUrl || null,
          youtube_url: invitation.youtubeUrl || null,
          title: invitation.audioTitle || null,
          autoplay: invitation.audioAutoplay,
        }),
        "invitation_audio.insert",
      );
      if (audioInsertErr) console.error("[syncRelatedTables] invitation_audio insert failed", { message: audioInsertErr.message });
    }

    await withDbTimeout(supabase.from("bank_accounts").delete().eq("invitation_id", invitation.id), "bank_accounts.delete");
    if (invitation.bankAccounts.length > 0) {
      await withDbTimeout(
        supabase.from("bank_accounts").insert(
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
        ),
        "bank_accounts.insert",
      );
    }

    await withDbTimeout(supabase.from("contacts").delete().eq("invitation_id", invitation.id), "contacts.delete");
    const contacts = invitation.contacts.filter((contact) => contact.phone || contact.name);
    if (contacts.length > 0) {
      await withDbTimeout(
        supabase.from("contacts").insert(
          contacts.map((contact, index) => ({
            invitation_id: invitation.id,
            role: contact.role,
            name: contact.name,
            phone: contact.phone,
            sort_order: index,
          })),
        ),
        "contacts.insert",
      );
    }
  } catch (error) {
    console.warn("[syncRelatedTables] skipped after DB failure", { error: error instanceof Error ? error.message : String(error) });
  }
}

export async function saveInvitationAction(invitation: SavedInvitation) {
  if (dbConfigMissing()) {
    return { invitation, source: "local" as const, ok: false, error: "DB 환경변수가 설정되지 않았습니다." };
  }

  console.log("[saveInvitationAction] DB 저장 시작", {
    id: invitation.id,
    slug: invitation.slug,
    coverImage: invitation.coverImage ? (invitation.coverImage.startsWith("https://") ? "https" : invitation.coverImage.startsWith("data:") ? "base64" : "other") : "없음",
    galleryCount: invitation.galleryItems?.length ?? 0,
  });
  console.log("[DB payload image check]", {
    coverImage: invitation.coverImage || invitation.introImage,
    galleryCount: invitation.galleryItems?.length ?? 0,
    galleryUrlSamples: (invitation.galleryItems ?? []).slice(0, 3).map((image) => image.url || image.previewUrl || ""),
  });

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await withDbTimeout(
      supabase.from("invitations").upsert(toDbPayload(invitation), { onConflict: "slug" }).select("*").single(),
      "saveInvitationAction",
    );

    if (error) {
      console.warn("[saveInvitationAction] failed", { error: error.message });
      return { invitation, source: "local" as const, ok: false, error: error.message };
    }

    const savedInvitation = fromDbPayload(data as Record<string, unknown>);
    await syncRelatedTables(savedInvitation);
    return { invitation: savedInvitation, source: "supabase" as const, ok: true, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[saveInvitationAction] failed", { error: message });
    return { invitation, source: "local" as const, ok: false, error: message };
  }
}

export async function deleteInvitationAction(invitationId: string) {
  if (dbConfigMissing() || !invitationId) {
    return { ok: false, error: "DB 환경변수가 설정되지 않았습니다." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    await withDbTimeout(supabase.from("invitation_images").delete().eq("invitation_id", invitationId), "delete images");
    await withDbTimeout(supabase.from("invitation_audio").delete().eq("invitation_id", invitationId), "delete audio");
    await withDbTimeout(supabase.from("bank_accounts").delete().eq("invitation_id", invitationId), "delete bank accounts");
    await withDbTimeout(supabase.from("contacts").delete().eq("invitation_id", invitationId), "delete contacts");
    const { error } = await withDbTimeout(supabase.from("invitations").delete().eq("id", invitationId), "delete invitation");
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[deleteInvitationAction] failed", { invitationId, error: message });
    return { ok: false, error: message };
  }
}

export async function uploadInvitationFileAction(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  const id = String(formData.get("id") ?? "");
  const invitationId = String(formData.get("invitationId") ?? "");
  const rawType = String(formData.get("type") ?? "");
  const type = normalizeUploadType(rawType) as UploadResult["type"];

  if (!(file instanceof File)) throw new Error("업로드할 파일이 없습니다.");
  if (!id || !invitationId || !type) throw new Error("업로드 정보가 올바르지 않습니다.");
  if (dbConfigMissing()) return { id, type, publicUrl: "" };

  try {
    const supabase = createSupabaseAdminClient();
    const bucket = type === "audio" ? "invitation-audio" : "invitation-images";
    const path = getSafeStoragePath({ invitationId, type, imageId: id, mimeType: file.type });

    console.log("[Storage upload start]", { rawType, type, path, fileType: file.type, fileSize: file.size });
    const { error } = await withDbTimeout(
      supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type || "application/octet-stream",
        upsert: true,
      }),
      "uploadInvitationFileAction",
    );

    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log("[Storage upload success]", { type, url: data.publicUrl });
    return { id, type, publicUrl: data.publicUrl };
  } catch (error) {
    console.error("[uploadInvitationFileAction] failed", { message: error instanceof Error ? error.message : String(error) });
    throw new Error("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
  }
}

export async function getInvitationBySlugAction(slug: string): Promise<SavedInvitation | null> {
  if (dbConfigMissing() || !slug) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await withDbTimeout(
      supabase.from("invitations").select("*").eq("slug", slug).maybeSingle(),
      "getInvitationBySlugAction",
    );
    if (error || !data) {
      if (error) console.warn("[getInvitationBySlugAction] failed", { message: error.message, slug });
      return null;
    }
    return fromDbPayload(data as Record<string, unknown>);
  } catch (error) {
    console.warn("[getInvitationBySlugAction] failed", { message: error instanceof Error ? error.message : String(error), slug });
    return null;
  }
}

export async function getInvitationByIdAction(invitationId: string): Promise<SavedInvitation | null> {
  if (dbConfigMissing() || !invitationId) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await withDbTimeout(
      supabase.from("invitations").select("*").eq("id", invitationId).maybeSingle(),
      "getInvitationByIdAction",
    );
    if (error || !data) {
      if (error) console.warn("[getInvitationByIdAction] failed", { message: error.message, invitationId });
      return null;
    }
    return fromDbPayload(data as Record<string, unknown>);
  } catch (error) {
    console.warn("[getInvitationByIdAction] failed", { message: error instanceof Error ? error.message : String(error), invitationId });
    return null;
  }
}

export async function getInvitationImagesAction(invitationId: string): Promise<InvitationImageRow[]> {
  if (dbConfigMissing() || !invitationId) return [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await withDbTimeout(
      supabase
        .from("invitation_images")
        .select("id, type, url, sort_order, caption")
        .eq("invitation_id", invitationId)
        .order("sort_order", { ascending: true }),
      "getInvitationImagesAction",
    );
    if (error) {
      console.warn("[getInvitationImagesAction] failed", { message: error.message });
      return [];
    }
    return (data ?? []) as InvitationImageRow[];
  } catch (error) {
    console.warn("[getInvitationImagesAction] failed", { message: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function createPurchaseSessionAction({
  invitationId,
  slug,
  naverProductUrl,
}: {
  invitationId: string;
  slug: string;
  naverProductUrl: string;
}) {
  console.log("[Purchase session create start]", { invitationId, slug });
  if (dbConfigMissing()) return { id: "", source: "local" as const };

  try {
    const supabase = createSupabaseAdminClient();
    const safeInvitationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(invitationId)
      ? invitationId
      : null;
    const { data, error } = await withDbTimeout(
      supabase
        .from("purchase_sessions")
        .insert({
          invitation_id: safeInvitationId,
          slug,
          status: "purchase_clicked",
          naver_product_url: naverProductUrl,
        })
        .select("id")
        .single(),
      "createPurchaseSessionAction",
    );

    if (error) throw new Error(error.message);
    console.log("[Purchase session create success]", { purchaseSessionId: data.id });
    return { id: String(data.id), source: "supabase" as const };
  } catch (error) {
    console.warn("[Purchase session create failed]", { message: error instanceof Error ? error.message : String(error), invitationId, slug });
    return { id: "", source: "local" as const };
  }
}

export async function submitRsvpAction(invitationId: string, form: Record<string, unknown>) {
  if (dbConfigMissing()) return { ok: true, source: "local" as const };
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await withDbTimeout(supabase.from("rsvps").insert({ invitation_id: invitationId, ...form }), "submitRsvpAction");
    if (error) throw new Error(error.message);
    return { ok: true, source: "supabase" as const };
  } catch (error) {
    console.warn("[submitRsvpAction] failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, source: "local" as const };
  }
}

export async function addGuestbookAction(invitationId: string, form: Record<string, unknown>) {
  if (dbConfigMissing()) return { ok: true, source: "local" as const };
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await withDbTimeout(supabase.from("guestbook").insert({ invitation_id: invitationId, ...form }), "addGuestbookAction");
    if (error) throw new Error(error.message);
    return { ok: true, source: "supabase" as const };
  } catch (error) {
    console.warn("[addGuestbookAction] failed", { error: error instanceof Error ? error.message : String(error) });
    return { ok: false, source: "local" as const };
  }
}
