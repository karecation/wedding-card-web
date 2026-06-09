/**
 * Helpers for validating and producing publicly reachable URLs.
 *
 * Kakao Picker (sharer.kakao.com/picker/link) and OG crawlers fetch shared
 * URLs server-side. Any `blob:`, `data:`, `localhost`, private IP, or
 * relative URL will return 500 Internal Server Error. We validate before
 * sending and supply safe fallbacks.
 */

/** Cleaned absolute origin used to anchor share URLs in production. */
export function getPublicBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

/** Public default thumbnail surfaced when nothing usable is configured. */
export const DEFAULT_PUBLIC_THUMBNAIL =
  "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png";

/** True if a URL can be fetched by external crawlers (Kakao, og:image). */
export function isPubliclyReachableUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;

  // Disallowed schemes / forms — Kakao Picker returns 500 for these.
  if (v.startsWith("blob:")) return false;
  if (v.startsWith("data:")) return false;
  if (v.startsWith("file:")) return false;
  if (v.startsWith("//")) return false; // protocol-relative
  if (v.startsWith("/")) return false;   // path-relative

  let parsed: URL;
  try {
    parsed = new URL(v);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const host = parsed.hostname;
  // Local-only or private hosts are unreachable from external crawlers.
  if (host === "localhost") return false;
  if (host === "127.0.0.1" || host === "::1") return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return false;
  if (host.endsWith(".local")) return false;
  if (host.endsWith(".internal")) return false;

  return true;
}

/** Returns the first input URL that is publicly reachable, or `""`. */
export function pickPublicUrl(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const v = (candidate ?? "").trim();
    if (isPubliclyReachableUrl(v)) return v;
  }
  return "";
}

/** Build a public absolute share URL like `https://<origin>/invitation/<slug>`. */
export function buildPublicInvitationUrl(slug: string | undefined, fallbackOrigin?: string): string {
  if (!slug) return "";
  const baseUrl = getPublicBaseUrl() || (fallbackOrigin ?? "");
  if (!baseUrl) return "";
  if (!isPubliclyReachableUrl(baseUrl)) return "";
  return `${baseUrl.replace(/\/$/, "")}/invitation/${encodeURIComponent(slug)}`;
}
