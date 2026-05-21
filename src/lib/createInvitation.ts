import { generateSlug } from "@/lib/generateSlug";
import { sanitizeInvitationForStorage } from "@/lib/invitation/sanitizeInvitationForStorage";
import type { CreateInvitationResult, InvitationData, SavedInvitation } from "@/types/invitation";

const invitationCollectionKey = "mobile-wedding-invitations";

function assertBrowserStorage() {
  if (typeof window === "undefined") {
    throw new Error("Invitation storage is only available in the browser for the localStorage MVP.");
  }
}

function readInvitations(): SavedInvitation[] {
  assertBrowserStorage();

  const rawInvitations = window.localStorage.getItem(invitationCollectionKey);
  if (!rawInvitations) return [];

  try {
    const invitations = JSON.parse(rawInvitations);
    return Array.isArray(invitations) ? invitations : [];
  } catch {
    window.localStorage.removeItem(invitationCollectionKey);
    return [];
  }
}

function writeInvitations(invitations: SavedInvitation[]) {
  assertBrowserStorage();
  try {
    window.localStorage.setItem(invitationCollectionKey, JSON.stringify(invitations.map(sanitizeInvitationForStorage)));
  } catch (error) {
    console.warn("[createInvitation] writeInvitations localStorage 저장 실패:", error instanceof Error ? error.message : error);
  }
}

export async function createInvitation(data: InvitationData): Promise<CreateInvitationResult> {
  assertBrowserStorage();

  // TODO: Supabase 저장 로직 추가
  const now = new Date().toISOString();
  const slug = generateSlug(data.groomName, data.brideName);
  const invitation: SavedInvitation = {
    ...data,
    id: slug,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  const invitations = readInvitations();
  writeInvitations([invitation, ...invitations]);

  return {
    invitation,
    slug,
  };
}

export async function getInvitationBySlug(slug: string): Promise<SavedInvitation | null> {
  assertBrowserStorage();

  // TODO: Supabase 조회 로직 추가
  const invitations = readInvitations();
  return invitations.find((invitation) => invitation.slug === slug) ?? null;
}

export { invitationCollectionKey };
