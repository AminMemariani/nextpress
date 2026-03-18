import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { registerBlock } from "../registry";
import type { BlockRenderProps } from "../types";

export const paragraphSchema = z.object({
  content: z.string().default(""),
  align: z.enum(["left", "center", "right"]).optional(),
  dropCap: z.boolean().default(false),
});

export type ParagraphAttributes = z.infer<typeof paragraphSchema>;

function ParagraphBlock({
  attributes,
  className,
}: BlockRenderProps<ParagraphAttributes>) {
  if (!attributes.content) return null;
  const style: React.CSSProperties = {};
  if (attributes.align) style.textAlign = attributes.align;

  return (
    <p
      className={`${className ?? ""} ${attributes.dropCap ? "np-drop-cap" : ""}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(attributes.content, {
          ALLOWED_TAGS: ["strong", "em", "a", "code", "br", "span", "mark"],
          ALLOWED_ATTR: ["href", "target", "rel", "class"],
        }),
      }}
    />
  );
}

registerBlock({
  type: "core/paragraph",
  title: "Paragraph",
  description: "A block of text",
  icon: "type",
  category: "text",
  keywords: ["text", "paragraph", "p"],
  attributesSchema: paragraphSchema,
  defaultAttributes: { content: "", dropCap: false },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: ParagraphBlock,
});
