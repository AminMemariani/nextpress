import "server-only";

import { headers } from "next/headers";
import { resolveSite, requireSite } from "./resolve";

/**
 * Get the current site in a server component or server action.
 * Returns null if no site found (public pages that work without a site).
 */
export async function getCurrentSite() {
  const h = await headers();
  return resolveSite(h);
}

/**
 * Get the current site ID, throwing if not found.
 * Use in admin routes where a site MUST exist.
 */
export async function requireCurrentSite() {
  const h = await headers();
  return requireSite(h);
}
