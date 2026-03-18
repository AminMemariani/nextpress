"use client";

import { useState, useEffect } from "react";

/** Returns true if the media query matches. SSR-safe (defaults to false). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Convenience: true if viewport is tablet or wider (>= 768px) */
export function useIsTablet() {
  return useMediaQuery("(min-width: 768px)");
}

/** Convenience: true if viewport is desktop (>= 1024px) */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
