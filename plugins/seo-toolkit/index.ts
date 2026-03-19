import type { PluginDefinition } from "@nextpress/core/plugin/plugin-types";
import type { PluginContext } from "@nextpress/core/plugin/plugin-context";

const seoToolkit: PluginDefinition = {
  slug: "seo-toolkit",

  async onActivate(ctx: PluginContext) {
    // ── Register SEO meta fields on all content types ──
    // These fields appear in the editor sidebar for every post/page.
    for (const typeSlug of ["post", "page"]) {
      await ctx.content.registerFields(typeSlug, [
        {
          key: "_seo_title",
          name: "SEO Title",
          fieldType: "TEXT",
          description: "Override the page title for search engines",
          group: "seo",
          sortOrder: 0,
          validation: { maxLength: 70 },
        },
        {
          key: "_seo_description",
          name: "Meta Description",
          fieldType: "TEXTAREA",
          description: "A short description for search result snippets",
          group: "seo",
          sortOrder: 1,
          validation: { maxLength: 160 },
        },
        {
          key: "_seo_canonical",
          name: "Canonical URL",
          fieldType: "URL",
          description: "Override the canonical URL (leave blank for default)",
          group: "seo",
          sortOrder: 2,
        },
        {
          key: "_seo_robots",
          name: "Robots",
          fieldType: "SELECT",
          options: [
            { label: "Index, Follow", value: "index,follow" },
            { label: "No Index", value: "noindex,follow" },
            { label: "No Follow", value: "index,nofollow" },
            { label: "No Index, No Follow", value: "noindex,nofollow" },
          ],
          group: "seo",
          sortOrder: 3,
        },
      ]);
    }

    // ── Hook: Enhance meta tags on content render ──
    ctx.hooks.addFilter("render:meta_tags", async (tags, entry) => {
      const seoTitle = entry.fields._seo_title as string | undefined;
      const seoDesc = entry.fields._seo_description as string | undefined;
      const canonical = entry.fields._seo_canonical as string | undefined;
      const robots = entry.fields._seo_robots as string | undefined;

      const settings = await ctx.settings.get();
      const separator = (settings.titleSeparator as string) ?? "|";

      return {
        ...tags,
        title: seoTitle ? `${seoTitle} ${separator} ${tags.siteName ?? ""}` : tags.title,
        description: seoDesc ?? tags.description,
        ...(canonical && { canonical }),
        ...(robots && { robots }),
      };
    }, 5); // Priority 5 = runs early

    // ── Hook: Inject structured data on published content ──
    ctx.hooks.addAction("content:published", async (entry) => {
      // Trigger sitemap regeneration on publish
      console.log(`[SEO] Content published: ${entry.title} — sitemap will regenerate`);
    });

    // ── Register admin page ──
    ctx.admin.registerPage({
      slug: "seo-settings",
      label: "SEO",
      href: "/admin/plugins/seo-toolkit",
      capability: "manage_seo",
    });

    // ── Register editor sidebar panel ──
    ctx.admin.registerSidebarPanel({
      slug: "seo-inspector",
      title: "SEO",
      contentTypes: ["post", "page"],
      position: 100,
      component: () => import("./components/seo-sidebar"),
    });

    // ── Register API route for sitemap ──
    ctx.api.registerRoute("GET", "/sitemap.xml", async () => {
      // Sitemap generation would go here
      return new Response("<xml>sitemap</xml>", {
        headers: { "Content-Type": "application/xml" },
      });
    });
  },

  async onDeactivate(ctx: PluginContext) {
    // Hooks auto-removed via source tracking. No manual cleanup needed.
    console.log("[SEO] Deactivated — hooks removed automatically");
  },

  async onUninstall(ctx: PluginContext) {
    // Remove SEO meta fields from content entries.
    // In production, you'd want a confirmation dialog before this.
    console.log("[SEO] Uninstalling — meta fields will be removed by cascade");
  },
};

export default seoToolkit;
