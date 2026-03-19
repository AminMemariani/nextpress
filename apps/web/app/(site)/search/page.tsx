import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { resolveTemplate } from "@nextpress/core/theme/template-resolver";
import { searchService } from "@nextpress/core/search/search-service";
import { getCachedThemeInstall } from "@/lib/cache/cached-queries";
import { SearchForm } from "@/components/site/search/search-form";
import { SearchResults } from "@/components/site/search/search-results";
import type { TemplateContext } from "@nextpress/core/theme/theme-types";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q ?? "";
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return <div>Site not found</div>;

  const query = params.q ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const theme = await themeManager.getActive(site.id);
  const install = await getCachedThemeInstall(site.id);
  const customizations = (install?.customizations as Record<string, unknown>) ?? {};

  // Search if query provided
  let searchResponse = null;
  if (query) {
    searchResponse = await searchService.search(site.id, {
      query,
      status: "PUBLISHED",
      page,
      perPage: 10,
    });
  }

  // Try to use theme's search template
  const templateMap = theme.templates;
  const Template = templateMap.get("search");

  if (Template) {
    const context: TemplateContext = {
      entry: null,
      entries: [],
      searchQuery: query,
      site: { name: site.name, tagline: site.tagline, url: site.domain ?? "" },
      customizations,
    };
    return <Template context={context} />;
  }

  // Default search UI (no theme template)
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <SearchForm initialQuery={query} />
      {searchResponse && (
        <div className="mt-8">
          <SearchResults
            results={searchResponse.results}
            query={searchResponse.query}
            total={searchResponse.total}
            durationMs={searchResponse.durationMs}
          />
          {/* Pagination */}
          {searchResponse.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: searchResponse.totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                  className={`px-3 py-1 rounded text-sm ${
                    p === page ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
