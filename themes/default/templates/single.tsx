import { BlockRenderer } from "@nextpress/blocks";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function SingleTemplate({ context }: TemplateProps) {
  const { entry } = context;
  if (!entry) return null;

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{entry.title}</h1>
        <div className="text-sm text-gray-500 flex gap-3">
          <span>By {entry.author.displayName ?? entry.author.name ?? "Unknown"}</span>
          {entry.publishedAt && (
            <time dateTime={entry.publishedAt.toISOString()}>
              {new Date(entry.publishedAt).toLocaleDateString()}
            </time>
          )}
        </div>
        {entry.terms.length > 0 && (
          <div className="mt-2 flex gap-2">
            {entry.terms.map((t) => (
              <a key={t.slug} href={`/${t.taxonomy.slug}/${t.slug}`}
                 className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200">
                {t.name}
              </a>
            ))}
          </div>
        )}
      </header>

      {entry.featuredImage && (
        <figure className="mb-8">
          <img src={entry.featuredImage.url} alt={entry.featuredImage.alt ?? ""} className="w-full rounded-lg" />
        </figure>
      )}

      <div className="prose max-w-none">
        <BlockRenderer blocks={entry.blocks} />
      </div>
    </article>
  );
}
