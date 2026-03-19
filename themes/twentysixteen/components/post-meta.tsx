import type { TemplateEntry } from "@nextpress/core/theme/theme-types";

interface Props {
  entry: TemplateEntry;
  showReadingTime?: boolean;
}

export function PostMeta({ entry, showReadingTime = true }: Props) {
  const readingTime = showReadingTime ? estimateReadingTime(entry.blocks) : null;

  return (
    <div className="np-single-meta">
      {entry.author.image && (
        <img src={entry.author.image} alt="" className="np-author-avatar" />
      )}
      <span style={{ fontWeight: 500 }}>{entry.author.displayName ?? entry.author.name ?? "Unknown"}</span>
      {entry.publishedAt && (
        <time dateTime={entry.publishedAt.toISOString()}>
          {new Date(entry.publishedAt).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric",
          })}
        </time>
      )}
      {readingTime && (
        <span className="np-reading-time">{readingTime} min read</span>
      )}
    </div>
  );
}

function estimateReadingTime(blocks: unknown[]): number {
  let wordCount = 0;
  function walk(list: any[]) {
    for (const block of list) {
      if (typeof block.attributes?.content === "string") {
        wordCount += block.attributes.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
      }
      if (block.innerBlocks?.length) walk(block.innerBlocks);
    }
  }
  walk(blocks);
  return Math.max(1, Math.round(wordCount / 200));
}
