import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { registerBlock } from "../registry";
import type { BlockRenderProps } from "../types";

export const quoteSchema = z.object({
  content: z.string().default(""),
  citation: z.string().optional(),
  style: z.enum(["default", "large", "pull"]).default("default"),
});

export type QuoteAttributes = z.infer<typeof quoteSchema>;

function QuoteBlock({ attributes, className }: BlockRenderProps<QuoteAttributes>) {
  return (
    <blockquote className={`${className ?? ""} np-quote-${attributes.style}`}>
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(attributes.content, {
            ALLOWED_TAGS: ["strong", "em", "a", "br", "p"],
            ALLOWED_ATTR: ["href"],
          }),
        }}
      />
      {attributes.citation && <cite>{attributes.citation}</cite>}
    </blockquote>
  );
}

registerBlock({
  type: "core/quote",
  title: "Quote",
  description: "A blockquote with optional citation",
  icon: "quote",
  category: "text",
  keywords: ["quote", "blockquote", "cite"],
  attributesSchema: quoteSchema,
  defaultAttributes: { content: "", style: "default" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: QuoteBlock,
});
