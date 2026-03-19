import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function ArchiveTemplate({ context }: TemplateProps) {
  const { entries = [], pagination } = context;

  return (
    <div>
      <div className="space-y-8">
        {entries.map((entry) => (
          <article key={entry.id} className="border-b pb-6">
            <h2 className="text-2xl font-bold">
              <a href={`/${entry.contentType.slug}/${entry.slug}`} className="text-gray-900 hover:text-blue-600">
                {entry.title}
              </a>
            </h2>
            {entry.excerpt && <p className="mt-2 text-gray-600">{entry.excerpt}</p>}
            <div className="mt-2 text-sm text-gray-400">
              {entry.author.displayName ?? entry.author.name} ·{" "}
              {entry.publishedAt && new Date(entry.publishedAt).toLocaleDateString()}
            </div>
          </article>
        ))}
      </div>
      {entries.length === 0 && <p className="text-gray-400 py-8 text-center">No entries found.</p>}

      {pagination && pagination.totalPages > 1 && (
        <nav className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`?page=${p}`}
               className={`px-3 py-1 rounded text-sm ${p === pagination.page ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
              {p}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
