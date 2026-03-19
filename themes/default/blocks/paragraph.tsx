import DOMPurify from "isomorphic-dompurify";
import type { BlockRenderProps } from "@nextpress/blocks";
import type { ParagraphAttributes } from "@nextpress/blocks/blocks/paragraph";

/**
 * Theme override for core/paragraph.
 * Adds the theme's prose styling and drop-cap class.
 */
export default function ThemedParagraph({ attributes, className }: BlockRenderProps<ParagraphAttributes>) {
  if (!attributes.content) return null;

  return (
    <p
      className={`${className ?? ""} ${attributes.dropCap ? "first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2" : ""}`}
      style={attributes.align ? { textAlign: attributes.align } : undefined}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(attributes.content, {
          ALLOWED_TAGS: ["strong", "em", "a", "code", "br", "span", "mark"],
          ALLOWED_ATTR: ["href", "target", "rel", "class"],
        }),
      }}
    />
  );
}
