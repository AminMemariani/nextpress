import { BlockRenderer } from "@nextpress/blocks";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function PageTemplate({ context }: TemplateProps) {
  const { entry } = context;
  if (!entry) return null;

  const isNoTitle = entry.template === "no-title";

  return (
    <div className="np-content-area np-full-width">
      <article>
        {!isNoTitle && (
          <h1 className="np-single-title">{entry.title}</h1>
        )}
        {entry.featuredImage && (
          <img src={entry.featuredImage.url} alt={entry.featuredImage.alt ?? ""} className="np-featured-image" />
        )}
        <div className="np-prose">
          <BlockRenderer blocks={entry.blocks} />
        </div>
      </article>
    </div>
  );
}
