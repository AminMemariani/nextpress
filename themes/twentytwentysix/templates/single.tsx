import { BlockRenderer } from "@nextpress/blocks";
import { ThemeSidebar } from "../components/sidebar";
import { PostMeta } from "../components/post-meta";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function SingleTemplate({ context }: TemplateProps) {
  const { entry, customizations } = context;
  if (!entry) return null;

  const showSidebar = customizations.showSidebar !== false && entry.template !== "full-width";
  const isCover = entry.template === "cover";
  const showAuthorBio = customizations.showAuthorBio !== false;
  const showShareButtons = customizations.showShareButtons !== false;

  return (
    <div className={`np-content-area ${showSidebar ? "np-has-sidebar" : "np-full-width"}`}>
      <article>
        {/* Cover header variant */}
        {isCover && entry.featuredImage ? (
          <div className="np-cover-header" style={{ backgroundImage: `url(${entry.featuredImage.url})` }}>
            <div className="np-cover-overlay" />
            <div className="np-cover-content">
              <h1 className="np-single-title">{entry.title}</h1>
              <PostMeta entry={entry} showReadingTime={customizations.showReadingTime as boolean} />
            </div>
          </div>
        ) : (
          /* Standard header */
          <header className="np-single-header">
            <h1 className="np-single-title">{entry.title}</h1>
            <PostMeta entry={entry} showReadingTime={customizations.showReadingTime as boolean} />
          </header>
        )}

        {/* Featured image (non-cover) */}
        {!isCover && entry.featuredImage && (
          <img src={entry.featuredImage.url} alt={entry.featuredImage.alt ?? ""} className="np-featured-image" />
        )}

        {/* Content */}
        <div className="np-prose">
          <BlockRenderer blocks={entry.blocks} />
        </div>

        {/* Tags */}
        {entry.terms.length > 0 && (
          <div className="np-tags">
            {entry.terms.map((t) => (
              <a key={t.slug} href={`/${t.taxonomy.slug}/${t.slug}`} className="np-tag">
                {t.name}
              </a>
            ))}
          </div>
        )}

        {/* Share */}
        {showShareButtons && (
          <div className="np-share">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(entry.title)}&url=${encodeURIComponent(`${context.site.url}/${entry.slug}`)}`} target="_blank" rel="noopener noreferrer" title="Share on X">𝕏</a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${context.site.url}/${entry.slug}`)}`} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn">in</a>
            <a href={`mailto:?subject=${encodeURIComponent(entry.title)}&body=${encodeURIComponent(`${context.site.url}/${entry.slug}`)}`} title="Share via email">@</a>
          </div>
        )}

        {/* Author bio */}
        {showAuthorBio && (
          <div className="np-author-bio">
            {entry.author.image && (
              <img src={entry.author.image} alt="" className="np-author-bio-avatar" />
            )}
            <div>
              <div className="np-author-bio-name">{entry.author.displayName ?? entry.author.name}</div>
              <div className="np-author-bio-desc">Author at {context.site.name}</div>
            </div>
          </div>
        )}
      </article>

      {showSidebar && <ThemeSidebar />}
    </div>
  );
}
