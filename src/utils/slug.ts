// src/utils/slug.ts

/**
 * Make a URL-safe slug from a string.
 * - lowercases
 * - strips accents/diacritics
 * - replaces spaces/underscores with "-"
 * - removes non alphanumerics (keeps "-")
 * - collapses multiple "-" and trims
 */
export function slugify(input: string, maxLen = 80): string {
  if (!input) return "";
  // strip accents
  const ascii = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // lower, replace spaces/underscores with "-", remove invalid chars
  let s = ascii
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen).replace(/-+$/g, "");
  return s;
}

/** Optional helper for uniqueness (append short random suffix) */
export function slugWithSuffix(base: string, len = 6) {
  const core = slugify(base);
  const suffix = Math.random().toString(36).slice(2, 2 + len);
  return `${core}-${suffix}`;
}
