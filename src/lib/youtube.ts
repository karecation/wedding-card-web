export function extractYouTubeVideoId(url: string) {
  if (!url.trim()) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v") ?? "";
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] ?? "";
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? "";
    }

    if (host === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }
  } catch {
    return "";
  }

  return "";
}
