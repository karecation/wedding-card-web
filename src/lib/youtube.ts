function normalizeVideoId(value: string) {
  const id = value.trim().split(/[?&#/]/)[0] ?? "";
  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
}

export function extractYouTubeVideoId(url: string) {
  if (!url.trim()) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return normalizeVideoId(parsed.searchParams.get("v") ?? "");
      if (parsed.pathname.startsWith("/shorts/")) return normalizeVideoId(parsed.pathname.split("/")[2] ?? "");
      if (parsed.pathname.startsWith("/embed/")) return normalizeVideoId(parsed.pathname.split("/")[2] ?? "");
    }

    if (host === "youtu.be") {
      return normalizeVideoId(parsed.pathname.replace("/", ""));
    }
  } catch {
    return "";
  }

  return "";
}

export function getYouTubeEmbedUrl(videoId: string) {
  const normalized = normalizeVideoId(videoId);
  return normalized ? `https://www.youtube.com/embed/${normalized}` : "";
}
