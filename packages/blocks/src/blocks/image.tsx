import { z } from "zod";
import { registerBlock } from "../registry";
import type { BlockRenderProps } from "../types";

export const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().default(""),
  caption: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  align: z.enum(["left", "center", "right", "wide", "full"]).default("center"),
  href: z.string().url().optional(),
  mediaId: z.string().optional(),
});

export type ImageAttributes = z.infer<typeof imageSchema>;

function ImageBlock({ attributes, className }: BlockRenderProps<ImageAttributes>) {
  const img = (
    <img
      src={attributes.url}
      alt={attributes.alt}
      width={attributes.width || undefined}
      height={attributes.height || undefined}
      loading="lazy"
    />
  );

  const linked = attributes.href ? (
    <a href={attributes.href} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  ) : (
    img
  );

  return (
    <figure className={`${className ?? ""} np-align-${attributes.align}`}>
      {linked}
      {attributes.caption && (
        <figcaption>{attributes.caption}</figcaption>
      )}
    </figure>
  );
}

registerBlock({
  type: "core/image",
  title: "Image",
  description: "An image with optional caption",
  icon: "image",
  category: "media",
  keywords: ["image", "photo", "picture", "img"],
  attributesSchema: imageSchema,
  defaultAttributes: { url: "", alt: "", align: "center" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: ImageBlock,
});
