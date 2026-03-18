"use client";

import type { BlockEditProps } from "@nextpress/blocks";
import type { HeadingAttributes } from "@nextpress/blocks/blocks/heading";

export function HeadingEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<HeadingAttributes>) {
  return (
    <div className="np-edit-heading">
      <div
        contentEditable
        suppressContentEditableWarning
        className={`np-editable np-heading-${attributes.level}`}
        data-placeholder="Heading..."
        style={{ fontSize: `${2.5 - (attributes.level - 1) * 0.3}rem`, fontWeight: "bold" }}
        onInput={(e) => {
          setAttributes({ content: (e.target as HTMLElement).innerHTML });
        }}
        dangerouslySetInnerHTML={{ __html: attributes.content || "" }}
      />
      {isSelected && (
        <div className="np-edit-controls">
          {([1, 2, 3, 4, 5, 6] as const).map((level) => (
            <button
              key={level}
              className={attributes.level === level ? "active" : ""}
              onClick={() => setAttributes({ level })}
            >
              H{level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
