export function buildTokens(name?: string, keywords: string[] = []) {
  const out = new Set<string>();
  const n = (name || "").toLowerCase().trim();
  if (n) {
    // split words and add progressive prefixes (enables fast 'Moh', 'Moham', etc.)
    const parts = n.split(/\s+/).filter(Boolean);
    for (const p of parts) {
      for (let i = 1; i <= Math.min(p.length, 20); i++) out.add(p.slice(0, i));
    }
    parts.forEach((p) => out.add(p));
  }
  keywords
    .map((k) => (k || "").toLowerCase().trim())
    .filter(Boolean)
    .forEach((k) => out.add(k));
  return Array.from(out);
}

export function randomToken(len = 24) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[(Math.random() * alphabet.length) | 0];
  return s;
}
