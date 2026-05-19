"use client";

import { create } from "zustand";
import { emptyInvitationData, type InvitationData } from "@/types/invitation";
import type { PendingUpload } from "@/lib/upload";

const STORAGE_KEY = "mobile-wedding-invitation";

type InvitationStore = {
  invitation: InvitationData;
  pendingUploads: PendingUpload[];
  isSaving: boolean;
  statusMessage: string;
  publicUrl: string;

  setInvitation: (data: InvitationData) => void;
  updateField: <K extends keyof InvitationData>(key: K, value: InvitationData[K]) => void;
  addPendingUpload: (upload: PendingUpload) => void;
  clearPendingUploads: () => void;
  setIsSaving: (v: boolean) => void;
  setStatusMessage: (msg: string) => void;
  setPublicUrl: (url: string) => void;
  loadFromStorage: () => void;
};

export const useInvitationStore = create<InvitationStore>((set, get) => ({
  invitation: { ...emptyInvitationData },
  pendingUploads: [],
  isSaving: false,
  statusMessage: "",
  publicUrl: "",

  setInvitation: (data) => {
    set({ invitation: data });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  },

  updateField: (key, value) => {
    const next = { ...get().invitation, [key]: value };
    set({ invitation: next });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  },

  addPendingUpload: (upload) => {
    set((s) => ({
      pendingUploads: [...s.pendingUploads.filter((u) => u.id !== upload.id), upload],
    }));
  },

  clearPendingUploads: () => set({ pendingUploads: [] }),
  setIsSaving: (v) => set({ isSaving: v }),
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setPublicUrl: (url) => set({ publicUrl: url }),

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set({ invitation: { ...emptyInvitationData, ...parsed } });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
