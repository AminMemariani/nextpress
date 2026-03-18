"use client";

import type { BlockEditProps } from "@nextpress/blocks";
import type { QuoteAttributes } from "@nextpress/blocks/blocks/quote";

export function QuoteEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<QuoteAttributes>) {
  return (
    <div className="np-edit-quote">
      <blockquote>
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write a quote..."
          onInput={(e) => {
            setAttributes({ content: (e.target as HTMLElement).innerHTML });
          }}
          dangerouslySetInnerHTML={{ __html: attributes.content || "" }}
        />
      </blockquote>
      <input
        type="text"
        placeholder="Citation (optional)"
        value={attributes.citation ?? ""}
        onChange={(e) => setAttributes({ citation: e.target.value })}
      />
      {isSelected && (
        <div className="np-edit-controls">
          <select
            value={attributes.style}
            onChange={(e) =>
              setAttributes({ style: e.target.value as QuoteAttributes["style"] })
            }
          >
            <option value="default">Default</option>
            <option value="large">Large</option>
            <option value="pull">Pull quote</option>
          </select>
        </div>
      )}
    </div>
  );
}
