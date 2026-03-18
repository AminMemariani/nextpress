"use client";

import type { BlockEditProps } from "@nextpress/blocks";
import type { ButtonAttributes } from "@nextpress/blocks/blocks/button";

export function ButtonEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<ButtonAttributes>) {
  return (
    <div className="np-edit-button" style={{ textAlign: attributes.align }}>
      <span
        className={`np-button np-button-${attributes.variant} np-button-${attributes.size}`}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => {
          setAttributes({ text: (e.target as HTMLElement).textContent ?? "" });
        }}
      >
        {attributes.text}
      </span>
      {isSelected && (
        <div className="np-edit-controls">
          <input
            type="url"
            placeholder="URL"
            value={attributes.url}
            onChange={(e) => setAttributes({ url: e.target.value })}
          />
          <select
            value={attributes.variant}
            onChange={(e) =>
              setAttributes({ variant: e.target.value as ButtonAttributes["variant"] })
            }
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
          <select
            value={attributes.size}
            onChange={(e) =>
              setAttributes({ size: e.target.value as ButtonAttributes["size"] })
            }
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={attributes.openInNewTab}
              onChange={(e) => setAttributes({ openInNewTab: e.target.checked })}
            />
            New tab
          </label>
        </div>
      )}
    </div>
  );
}
