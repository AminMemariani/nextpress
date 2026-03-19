import DOMPurify from "isomorphic-dompurify";
import type { SearchResult } from "@nextpress/core/search/search-types";

interface Props {
  results: SearchResult[];
  query: string;
  total: number;
  durationMs: number;
}

export function SearchResults({ results, query, total, durationMs }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {total} result{total !== 1 ? "s" : ""} for "{query}" ({durationMs}ms)
      </p>

      {results.length === 0 && (
        <p className="text-gray-400 py-8 text-center">
          No results found. Try a different search term.
        </p>
      )}

      <div className="space-y-6">
        {results.map((result) => (
          <article key={result.id} className="border-b pb-4">
            <a
              href={`/${result.slug}`}
              className="text-lg font-semibold text-blue-700 hover:underline"
            >
              {result.title}
            </a>
            <div className="text-xs text-gray-400 mt-1">
              {result.contentTypeSlug} · {result.author.displayName ?? result.author.name}
              {result.publishedAt && (
                <> · {new Date(result.publishedAt).toLocaleDateString()}</>
              )}
            </div>
            {result.highlight && (
              <p
                className="text-sm text-gray-600 mt-2"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(result.highlight, {
                    ALLOWED_TAGS: ["mark"],
                  }),
                }}
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
