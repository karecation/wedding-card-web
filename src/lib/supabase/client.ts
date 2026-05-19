"use client";

import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
  };
}

export function hasSupabaseBrowserConfig() {
  const { url, publishableKey } = getSupabaseBrowserConfig();
  return Boolean(url && publishableKey);
}

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();

  if (!url || !publishableKey) {
    throw new Error("Supabase browser 환경변수가 설정되지 않았습니다.");
  }

  return createBrowserClient(url, publishableKey);
}
