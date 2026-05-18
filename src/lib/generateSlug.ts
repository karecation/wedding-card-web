function normalizeName(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || fallback;
}

function createRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function generateSlug(groomName: string, brideName: string) {
  const groom = normalizeName(groomName, "groom");
  const bride = normalizeName(brideName, "bride");

  return `${groom}-${bride}-${createRandomId()}`;
}
