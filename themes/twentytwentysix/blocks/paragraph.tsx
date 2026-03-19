import DOMPurify from "isomorphic-dompurify";
import type { BlockRenderProps } from "@nextpress/blocks";

/**
 * Twenty Twentysix paragraph — uses theme prose styling,
 * with drop cap using CSS first-letter pseudo-element.
 */
export default function ThemedParagraph({ attributes, className }: BlockRenderProps) {
  const content = attributes.content as string;
  if (!content) return null;

  const align = attributes.align as string | undefined;
  const dropCap = attributes.dropCap as boolean | undefined;

  return (
    <p
      className={`${className ?? ""} ${dropCap ? "np-drop-cap" : ""}`}
      style={align ? { textAlign: align as any } : undefined}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content, {
          ALLOWED_TAGS: ["strong", "em", "a", "code", "br", "span", "mark", "sub", "sup"],
          ALLOWED_ATTR: ["href", "target", "rel", "class"],
          ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        }),
      }}
    />
  );
}
