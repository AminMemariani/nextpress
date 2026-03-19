import type { TemplateEntry } from "@nextpress/core/theme/theme-types";

interface Props {
  recentPosts?: TemplateEntry[];
  categories?: Array<{ name: string; slug: string; count?: number }>;
}

export function ThemeSidebar({ recentPosts, categories }: Props) {
  return (
    <aside className="np-sidebar">
      {/* Search */}
      <div className="np-widget">
        <h3 className="np-widget-title">Search</h3>
        <form action="/search" method="get" className="np-search-form">
          <input type="search" name="q" placeholder="Search..." className="np-search-input" />
        </form>
      </div>

      {/* Recent posts */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="np-widget">
          <h3 className="np-widget-title">Recent Posts</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {recentPosts.slice(0, 5).map((post) => (
              <li key={post.id} style={{ marginBottom: "0.5rem" }}>
                <a href={`/${post.slug}`} style={{ color: "var(--np-text)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
                  {post.title}
                </a>
                {post.publishedAt && (
                  <time style={{ display: "block", fontSize: "0.75rem", color: "var(--np-text-secondary)" }}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </time>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="np-widget">
          <h3 className="np-widget-title">Categories</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {categories.map((cat) => (
              <li key={cat.slug} style={{ marginBottom: "0.375rem" }}>
                <a href={`/category/${cat.slug}`} style={{ color: "var(--np-text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}>
                  {cat.name} {cat.count !== undefined && <span>({cat.count})</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* About */}
      <div className="np-widget">
        <h3 className="np-widget-title">About This Site</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--np-text-secondary)" }}>
          This site is powered by NextPress, a modern CMS built on Next.js, TypeScript, and PostgreSQL.
        </p>
      </div>
    </aside>
  );
}
