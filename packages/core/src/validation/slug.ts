/**
 * Slug generation and validation utilities.
 * Slugs are URL-safe identifiers: lowercase, hyphenated, ASCII-only.
 */

/** Convert any string to a valid slug */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")                     // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")       // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")         // remove non-alphanumeric
    .replace(/[\s_]+/g, "-")              // spaces/underscores to hyphens
    .replace(/-+/g, "-")                  // collapse multiple hyphens
    .replace(/^-|-$/g, "");               // trim leading/trailing hyphens
}

/** Regex for a valid slug */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Max slug length */
export const SLUG_MAX_LENGTH = 200;

/**
 * Generate a unique slug by appending -2, -3, etc. if the base slug exists.
 * `existsCheck` should return true if the slug is already taken.
 */
export async function uniqueSlug(
  base: string,
  existsCheck: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = slugify(base).slice(0, SLUG_MAX_LENGTH);
  if (!candidate) candidate = "untitled";

  if (!(await existsCheck(candidate))) {
    return candidate;
  }

  // Try appending -2, -3, ... up to -99
  for (let i = 2; i <= 99; i++) {
    const numbered = `${candidate}-${i}`.slice(0, SLUG_MAX_LENGTH);
    if (!(await existsCheck(numbered))) {
      return numbered;
    }
  }

  // Fallback: append random suffix
  const random = Math.random().toString(36).slice(2, 8);
  return `${candidate}-${random}`.slice(0, SLUG_MAX_LENGTH);
}
