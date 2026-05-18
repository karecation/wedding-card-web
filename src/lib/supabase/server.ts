import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "",
    adminKey:
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      "",
  };
}

export function hasSupabaseServerConfig() {
  const { url, adminKey } = getSupabaseServerConfig();
  return Boolean(url && adminKey);
}

export function createSupabaseAdminClient() {
  const { url, adminKey } = getSupabaseServerConfig();

  if (!url || !adminKey) {
    throw new Error("Supabase server/admin 환경변수가 설정되지 않았습니다.");
  }

  return createClient(url, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseServerConfig();

  if (!url || !publishableKey) {
    throw new Error("Supabase server 환경변수가 설정되지 않았습니다.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
