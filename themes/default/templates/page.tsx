import { BlockRenderer } from "@nextpress/blocks";
import type { TemplateProps } from "@nextpress/core/theme/theme-types";

export default function PageTemplate({ context }: TemplateProps) {
  const { entry } = context;
  if (!entry) return null;

  return (
    <article>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{entry.title}</h1>
      <div className="prose max-w-none">
        <BlockRenderer blocks={entry.blocks} />
      </div>
    </article>
  );
}
