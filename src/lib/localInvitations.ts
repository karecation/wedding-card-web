"use client";

import { emptyInvitationData, type SavedInvitation } from "@/types/invitation";
import { sanitizeInvitationForStorage } from "@/lib/invitation/sanitizeInvitationForStorage";

export const LOCAL_INVITATIONS_STORAGE_KEY = "wedding_invitations";
export const LOCAL_INVITATION_LIST_KEY = "wedding_invitation_list";
export const LOCAL_SESSION_ID_KEY = "wedding_session_id";
export const MAX_LOCAL_INVITATIONS_PER_SESSION = 3;
const LEGACY_STORAGE_KEYS = ["mobile-wedding-invitations", LOCAL_INVITATIONS_STORAGE_KEY];

export type LocalInvitationSummary = {
  id: string;
  slug: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  hallName: string;
  thumbnail: string;
  updatedAt: string;
  isPublished: boolean;
  sessionId: string;
};

function detailKey(id: string) {
  return `wedding_invitation_detail_${id}`;
}

export function getWeddingSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(LOCAL_SESSION_ID_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(LOCAL_SESSION_ID_KEY, next);
  return next;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseLegacyList(raw: string | null): SavedInvitation[] {
  const parsed = parseJson<unknown>(raw, []);
  return Array.isArray(parsed) ? (parsed.filter(Boolean) as SavedInvitation[]) : [];
}

function withDefaults(invitation: SavedInvitation): SavedInvitation {
  return {
    ...emptyInvitationData,
    ...invitation,
    location: {
      ...emptyInvitationData.location,
      ...(invitation.location ?? {}),
    },
    gallery: {
      ...emptyInvitationData.gallery,
      ...(invitation.gallery ?? {}),
    },
  };
}

function toSummary(invitation: SavedInvitation): LocalInvitationSummary {
  const sessionId = getWeddingSessionId();
  const title = `${invitation.groomName || "신랑"} ♥ ${invitation.brideName || "신부"}`;
  return {
    id: invitation.id,
    slug: invitation.slug,
    title,
    groomName: invitation.groomName || "신랑",
    brideName: invitation.brideName || "신부",
    weddingDate: invitation.weddingDate,
    weddingTime: invitation.weddingTime || `${invitation.weddingPeriod} ${invitation.weddingHour} ${invitation.weddingMinute}`,
    venueName: invitation.location?.venueName || invitation.venueName,
    hallName: invitation.location?.hallName || invitation.venueHall,
    thumbnail: invitation.kakaoThumbnailUrl || invitation.urlThumbnailUrl || invitation.coverImage || invitation.introImage || "",
    updatedAt: invitation.updatedAt,
    isPublished: invitation.isPublished,
    sessionId,
  };
}

export function listLocalInvitationSummaries(): LocalInvitationSummary[] {
  if (typeof window === "undefined") return [];
  const sessionId = getWeddingSessionId();

  const primary = parseJson<LocalInvitationSummary[]>(window.localStorage.getItem(LOCAL_INVITATION_LIST_KEY), []);
  const legacySummaries = LEGACY_STORAGE_KEYS.flatMap((key) =>
    parseLegacyList(window.localStorage.getItem(key)).map((item) => toSummary(withDefaults(item))),
  );
  const seen = new Set<string>();

  return [...primary, ...legacySummaries]
    .filter((item) => !item.sessionId || item.sessionId === sessionId)
    .filter((item) => {
      const key = item.id || item.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export function canCreateLocalInvitation(nextId?: string) {
  const list = listLocalInvitationSummaries();
  if (nextId && list.some((item) => item.id === nextId || item.slug === nextId)) return true;
  return list.length < MAX_LOCAL_INVITATIONS_PER_SESSION;
}

export function listLocalInvitations(): SavedInvitation[] {
  if (typeof window === "undefined") return [];
  return listLocalInvitationSummaries()
    .map((item) => readLocalInvitation(item.id) ?? readLocalInvitation(item.slug))
    .filter((item): item is SavedInvitation => Boolean(item));
}

export function readLocalInvitation(identifier: string): SavedInvitation | null {
  if (typeof window === "undefined") return null;

  const decoded = decodeURIComponent(identifier);
  const summaries = listLocalInvitationSummaries();
  const summary = summaries.find((item) => item.id === decoded || item.slug === decoded);
  const detailId = summary?.id || decoded;
  const direct = parseJson<SavedInvitation | null>(window.localStorage.getItem(detailKey(detailId)), null);
  if (direct) return withDefaults(direct);

  for (const key of LEGACY_STORAGE_KEYS) {
    const found = parseLegacyList(window.localStorage.getItem(key)).find((item) => item.id === decoded || item.slug === decoded);
    if (found) return withDefaults(found);
  }

  return null;
}

export function saveLocalInvitationRecord(invitation: SavedInvitation) {
  if (typeof window === "undefined") return false;

  try {
    const sanitized = sanitizeInvitationForStorage(invitation);
    const summary = toSummary(sanitized);
    const current = listLocalInvitationSummaries();
    const isUpdate = current.some((item) => item.id === summary.id || item.slug === summary.slug);

    if (!isUpdate && current.length >= MAX_LOCAL_INVITATIONS_PER_SESSION) {
      console.warn("[LOCAL_INVITATIONS] save blocked by session limit", { max: MAX_LOCAL_INVITATIONS_PER_SESSION });
      return false;
    }

    const nextList = [summary, ...current.filter((item) => item.id !== summary.id && item.slug !== summary.slug)];

    window.localStorage.setItem(detailKey(sanitized.id), JSON.stringify(sanitized));
    window.localStorage.setItem(LOCAL_INVITATION_LIST_KEY, JSON.stringify(nextList));
    console.log("[LOCAL_INVITATIONS] saved", { id: sanitized.id, slug: sanitized.slug, count: nextList.length });
    return true;
  } catch (error) {
    console.warn("[LOCAL_INVITATIONS] save failed", { error });
    return false;
  }
}

export function deleteLocalInvitation(identifier: string) {
  if (typeof window === "undefined") return;
  const decoded = decodeURIComponent(identifier);
  const current = listLocalInvitationSummaries();
  const target = current.find((item) => item.id === decoded || item.slug === decoded);
  const next = current.filter((item) => item.id !== decoded && item.slug !== decoded);
  if (target?.id) window.localStorage.removeItem(detailKey(target.id));
  window.localStorage.removeItem(detailKey(decoded));
  window.localStorage.setItem(LOCAL_INVITATION_LIST_KEY, JSON.stringify(next));
  console.log("[LOCAL_INVITATIONS] deleted", { id: decoded });
}
