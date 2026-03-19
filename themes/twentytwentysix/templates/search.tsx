import { PostMeta } from "../components/post-meta";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function SearchTemplate({ context }: TemplateProps) {
  const { entries = [], searchQuery, pagination } = context;

  return (
    <div className="np-content-area np-full-width">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {searchQuery ? `Search results for "${searchQuery}"` : "Search"}
      </h1>
      <p style={{ color: "var(--np-text-secondary)", marginBottom: "2rem" }}>
        {entries.length} result{entries.length !== 1 ? "s" : ""} found
      </p>

      {entries.map((entry) => (
        <article key={entry.id} className="np-post-card">
          <h2 className="np-post-card-title">
            <a href={`/${entry.slug}`}>{entry.title}</a>
          </h2>
          <PostMeta entry={entry} showReadingTime={false} />
          {entry.excerpt && <p className="np-post-card-excerpt">{entry.excerpt}</p>}
        </article>
      ))}

      {entries.length === 0 && searchQuery && (
        <p style={{ color: "var(--np-text-secondary)", textAlign: "center", padding: "4rem 0" }}>
          No results found. Try different keywords.
        </p>
      )}
    </div>
  );
}
