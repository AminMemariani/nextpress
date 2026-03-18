"use client";

import type { BlockEditProps } from "@nextpress/blocks";
import type { ParagraphAttributes } from "@nextpress/blocks/blocks/paragraph";

export function ParagraphEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<ParagraphAttributes>) {
  return (
    <div className="np-edit-paragraph">
      <div
        contentEditable
        suppressContentEditableWarning
        className="np-editable"
        data-placeholder="Type something..."
        onInput={(e) => {
          setAttributes({ content: (e.target as HTMLElement).innerHTML });
        }}
        dangerouslySetInnerHTML={{ __html: attributes.content || "" }}
      />
      {isSelected && (
        <div className="np-edit-controls">
          <select
            value={attributes.align ?? "left"}
            onChange={(e) =>
              setAttributes({ align: e.target.value as ParagraphAttributes["align"] })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={attributes.dropCap}
              onChange={(e) => setAttributes({ dropCap: e.target.checked })}
            />
            Drop cap
          </label>
        </div>
      )}
    </div>
  );
}
