import { ThemeSidebar } from "../components/sidebar";
import { PostMeta } from "../components/post-meta";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function ArchiveTemplate({ context }: TemplateProps) {
  const { entries = [], term, pagination, customizations } = context;
  const showSidebar = customizations.showSidebar !== false;

  const title = term ? `${term.taxonomy}: ${term.name}` : "Archive";

  return (
    <div className={`np-content-area ${showSidebar ? "np-has-sidebar" : "np-full-width"}`}>
      <main>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "2rem" }}>{title}</h1>

        {entries.map((entry) => (
          <article key={entry.id} className="np-post-card">
            {entry.featuredImage && (
              <a href={`/${entry.slug}`}>
                <img src={entry.featuredImage.url} alt={entry.featuredImage.alt ?? ""} className="np-post-card-image" loading="lazy" />
              </a>
            )}
            <h2 className="np-post-card-title">
              <a href={`/${entry.slug}`}>{entry.title}</a>
            </h2>
            <PostMeta entry={entry} />
            {entry.excerpt && <p className="np-post-card-excerpt">{entry.excerpt}</p>}
            <a href={`/${entry.slug}`} className="np-read-more">Read more →</a>
          </article>
        ))}

        {entries.length === 0 && (
          <p style={{ color: "var(--np-text-secondary)", textAlign: "center", padding: "4rem 0" }}>
            No posts found.
          </p>
        )}

        {pagination && pagination.totalPages > 1 && (
          <nav className="np-pagination">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <a key={p} href={`?page=${p}`} className={p === pagination.page ? "np-current" : ""}>
                {p}
              </a>
            ))}
          </nav>
        )}
      </main>

      {showSidebar && <ThemeSidebar />}
    </div>
  );
}
