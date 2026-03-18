import { z } from "zod";
import { registerBlock } from "../registry";
import type { BlockRenderProps } from "../types";

export const buttonSchema = z.object({
  text: z.string().min(1).default("Click here"),
  url: z.string().url().default("#"),
  variant: z.enum(["primary", "secondary", "outline", "ghost"]).default("primary"),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  openInNewTab: z.boolean().default(false),
  align: z.enum(["left", "center", "right"]).default("left"),
});

export type ButtonAttributes = z.infer<typeof buttonSchema>;

function ButtonBlock({ attributes, className }: BlockRenderProps<ButtonAttributes>) {
  return (
    <div
      className={className}
      style={{ textAlign: attributes.align }}
    >
      <a
        href={attributes.url}
        className={`np-button np-button-${attributes.variant} np-button-${attributes.size}`}
        target={attributes.openInNewTab ? "_blank" : undefined}
        rel={attributes.openInNewTab ? "noopener noreferrer" : undefined}
      >
        {attributes.text}
      </a>
    </div>
  );
}

// This block doubles as the CTA block. A "CTA" is just a styled button
// with a specific variant — no need for a separate block type.
registerBlock({
  type: "core/button",
  title: "Button / CTA",
  description: "A call-to-action button",
  icon: "mouse-pointer-click",
  category: "widgets",
  keywords: ["button", "cta", "call to action", "link"],
  attributesSchema: buttonSchema,
  defaultAttributes: { text: "Click here", url: "#", variant: "primary", size: "md", openInNewTab: false, align: "left" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: ButtonBlock,
});
