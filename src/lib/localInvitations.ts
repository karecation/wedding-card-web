"use client";

import { emptyInvitationData, type SavedInvitation } from "@/types/invitation";
import { sanitizeInvitationForStorage } from "@/lib/invitation/sanitizeInvitationForStorage";

export const LOCAL_INVITATIONS_STORAGE_KEY = "wedding_invitations";
const LEGACY_STORAGE_KEYS = ["mobile-wedding-invitations"];

function parseList(raw: string | null): SavedInvitation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
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

export function listLocalInvitations(): SavedInvitation[] {
  if (typeof window === "undefined") return [];

  const primary = parseList(window.localStorage.getItem(LOCAL_INVITATIONS_STORAGE_KEY));
  const legacy = LEGACY_STORAGE_KEYS.flatMap((key) => parseList(window.localStorage.getItem(key)));
  const merged = [...primary, ...legacy];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      const key = item.id || item.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(withDefaults)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export function readLocalInvitation(identifier: string): SavedInvitation | null {
  const decoded = decodeURIComponent(identifier);
  return listLocalInvitations().find((item) => item.id === decoded || item.slug === decoded) ?? null;
}

export function saveLocalInvitationRecord(invitation: SavedInvitation) {
  if (typeof window === "undefined") return false;

  try {
    const sanitized = sanitizeInvitationForStorage(invitation);
    const current = listLocalInvitations();
    const next = [
      sanitized,
      ...current.filter((item) => item.id !== sanitized.id && item.slug !== sanitized.slug),
    ];
    window.localStorage.setItem(LOCAL_INVITATIONS_STORAGE_KEY, JSON.stringify(next));
    console.log("[LOCAL_INVITATIONS] saved", { id: sanitized.id, slug: sanitized.slug, count: next.length });
    return true;
  } catch (error) {
    console.warn("[LOCAL_INVITATIONS] save failed", { error });
    return false;
  }
}
