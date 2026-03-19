import { BlockRenderer } from "@nextpress/blocks";
import { ThemeSidebar } from "../components/sidebar";
import { PostMeta } from "../components/post-meta";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function HomeTemplate({ context }: TemplateProps) {
  const { entries = [], site, customizations } = context;
  const showSidebar = customizations.showSidebar !== false;
  const showExcerpts = customizations.showExcerpts !== false;

  return (
    <div className={`np-content-area ${showSidebar ? "np-has-sidebar" : "np-full-width"}`}>
      <main>
        {/* Hero section */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.025em" }}>{site.name}</h1>
          {site.tagline && (
            <p style={{ color: "var(--np-text-secondary)", fontSize: "1.125rem", marginTop: "0.25rem" }}>
              {site.tagline}
            </p>
          )}
        </div>

        {/* Post list */}
        <div>
          {entries.map((entry, i) => (
            <article key={entry.id} className="np-post-card">
              {entry.featuredImage && i < 3 && (
                <a href={`/${entry.slug}`}>
                  <img
                    src={entry.featuredImage.url}
                    alt={entry.featuredImage.alt ?? entry.title}
                    className="np-post-card-image"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                </a>
              )}
              <h2 className="np-post-card-title">
                <a href={`/${entry.slug}`}>{entry.title}</a>
              </h2>
              <PostMeta entry={entry} showReadingTime={customizations.showReadingTime as boolean} />
              {showExcerpts && entry.excerpt && (
                <p className="np-post-card-excerpt">{entry.excerpt}</p>
              )}
              <a href={`/${entry.slug}`} className="np-read-more">Read more →</a>
            </article>
          ))}
          {entries.length === 0 && (
            <p style={{ color: "var(--np-text-secondary)", textAlign: "center", padding: "4rem 0" }}>
              No posts yet. Start writing!
            </p>
          )}
        </div>

        {/* Pagination */}
        {context.pagination && context.pagination.totalPages > 1 && (
          <nav className="np-pagination">
            {Array.from({ length: context.pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <a key={p} href={`?page=${p}`} className={p === context.pagination!.page ? "np-current" : ""}>
                {p}
              </a>
            ))}
          </nav>
        )}
      </main>

      {showSidebar && <ThemeSidebar recentPosts={entries.slice(0, 5)} />}
    </div>
  );
}
