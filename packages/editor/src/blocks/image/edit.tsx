"use client";

import { useState } from "react";
import type { BlockEditProps } from "@nextpress/blocks";
import type { ImageAttributes } from "@nextpress/blocks/blocks/image";

export function ImageEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<ImageAttributes>) {
  const [showUrlInput, setShowUrlInput] = useState(!attributes.url);

  if (!attributes.url || showUrlInput) {
    return (
      <div className="np-edit-image-placeholder">
        <p>Image URL</p>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          defaultValue={attributes.url}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setAttributes({ url: (e.target as HTMLInputElement).value });
              setShowUrlInput(false);
            }
          }}
        />
        <p className="np-hint">Press Enter to confirm. Media library picker coming soon.</p>
      </div>
    );
  }

  return (
    <div className="np-edit-image">
      <figure>
        <img
          src={attributes.url}
          alt={attributes.alt}
          style={{ maxWidth: "100%", cursor: "pointer" }}
          onClick={() => setShowUrlInput(true)}
        />
      </figure>
      {isSelected && (
        <div className="np-edit-controls">
          <input
            type="text"
            placeholder="Alt text"
            value={attributes.alt}
            onChange={(e) => setAttributes({ alt: e.target.value })}
          />
          <input
            type="text"
            placeholder="Caption"
            value={attributes.caption ?? ""}
            onChange={(e) => setAttributes({ caption: e.target.value })}
          />
          <select
            value={attributes.align}
            onChange={(e) =>
              setAttributes({ align: e.target.value as ImageAttributes["align"] })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="wide">Wide</option>
            <option value="full">Full</option>
          </select>
        </div>
      )}
    </div>
  );
}
