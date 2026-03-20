/**
 * Template Resolver
 *
 * Given a request context (content type, slug, taxonomy, etc.),
 * determines which template to render by walking the hierarchy
 * from most-specific to least-specific.
 *
 * Resolution is DETERMINISTIC: same input → same template.
 * No randomness, no side effects, no DB queries.
 * This makes it safe for SSR, ISR, and caching.
 *
 * The resolver receives the theme's template map and the content
 * context, and returns the first matching template component.
 */

import type { TemplateComponent } from "./theme-types";

export interface ResolveContext {
  /** What kind of page: "single", "archive", "taxonomy", "search", "404", "home" */
  pageType: "single" | "archive" | "taxonomy" | "search" | "404" | "home";
  /** Content type slug (e.g., "post", "page", "product") */
  contentTypeSlug?: string;
  /** Content entry slug */
  entrySlug?: string;
  /** Per-entry template override from the editor (e.g., "full-width") */
  entryTemplate?: string | null;
  /** Whether the content type is hierarchical (pages) */
  isHierarchical?: boolean;
  /** Taxonomy slug (e.g., "category", "tag") */
  taxonomySlug?: string;
  /** Term slug within a taxonomy */
  termSlug?: string;
}

/**
 * Resolve the template to use for a given page.
 *
 * Returns the first template found in the hierarchy.
 * Falls back to the "index" template (which every theme MUST provide).
 *
 * @param templates - Theme's template map (slug → component)
 * @param ctx - The current page context
 */
export function resolveTemplate(
  templates: Map<string, TemplateComponent>,
  ctx: ResolveContext,
): { template: TemplateComponent; resolvedSlug: string } {
  const candidates = buildHierarchy(ctx);

  for (const slug of candidates) {
    const tpl = templates.get(slug);
    if (tpl) {
      return { template: tpl, resolvedSlug: slug };
    }
  }

  // Ultimate fallback — "index" must exist
  const index = templates.get("index");
  if (index) {
    return { template: index, resolvedSlug: "index" };
  }

  throw new Error(
    `Theme has no "index" template. Tried: ${candidates.join(" → ")}`,
  );
}

/**
 * Build the template hierarchy for a given context.
 * Ordered from most-specific to least-specific.
 *
 * Examples:
 *   Single post "hello-world":
 *     → single-post-hello-world, single-post, single, index
 *
 *   Single page with template "full-width":
 *     → full-width, page-{slug}, page, single, index
 *
 *   Category "tech" archive:
 *     → taxonomy-category-tech, taxonomy-category, taxonomy, archive, index
 *
 *   Product archive:
 *     → archive-product, archive, index
 *
 *   Homepage:
 *     → front-page, home, index
 *
 *   Search:
 *     → search, archive, index
 *
 *   404:
 *     → 404, index
 */
export function buildHierarchy(ctx: ResolveContext): string[] {
  const h: string[] = [];

  switch (ctx.pageType) {
    case "single": {
      // Per-entry template override takes highest priority
      if (ctx.entryTemplate) {
        h.push(ctx.entryTemplate);
      }

      // Exact match: single-{type}-{slug}
      if (ctx.contentTypeSlug && ctx.entrySlug) {
        h.push(`single-${ctx.contentTypeSlug}-${ctx.entrySlug}`);
      }

      // Hierarchical content uses "page" template
      if (ctx.isHierarchical) {
        if (ctx.entrySlug) h.push(`page-${ctx.entrySlug}`);
        h.push("page");
      }

      // Content type match: single-{type}
      if (ctx.contentTypeSlug) {
        h.push(`single-${ctx.contentTypeSlug}`);
      }

      h.push("single");
      break;
    }

    case "archive": {
      if (ctx.contentTypeSlug) {
        h.push(`archive-${ctx.contentTypeSlug}`);
      }
      h.push("archive");
      break;
    }

    case "taxonomy": {
      if (ctx.taxonomySlug && ctx.termSlug) {
        h.push(`taxonomy-${ctx.taxonomySlug}-${ctx.termSlug}`);
      }
      if (ctx.taxonomySlug) {
        h.push(`taxonomy-${ctx.taxonomySlug}`);
      }
      h.push("taxonomy");
      h.push("archive");
      break;
    }

    case "search":
      h.push("search");
      h.push("archive");
      break;

    case "404":
      h.push("404");
      break;

    case "home":
      h.push("front-page");
      h.push("home");
      break;
  }

  h.push("index");
  return h;
}

/**
 * List all templates available for a content type in the editor sidebar.
 * Returns the theme's templateChoices filtered by content type,
 * plus a "Default" option.
 */
export function getTemplateChoicesForType(
  themeChoices: Array<{
    slug: string;
    name: string;
    description?: string;
    contentTypes: string[];
  }>,
  contentTypeSlug: string,
): Array<{ slug: string; name: string; description?: string }> {
  const choices: Array<{ slug: string; name: string; description?: string }> = [
    { slug: "", name: "Default Template", description: "Uses the theme's default template for this content type" },
  ];

  for (const choice of themeChoices) {
    if (
      choice.contentTypes.length === 0 ||
      choice.contentTypes.includes(contentTypeSlug)
    ) {
      choices.push({
        slug: choice.slug,
        name: choice.name,
        description: choice.description,
      });
    }
  }

  return choices;
}
