"use client";

import type { BlockEditProps } from "@nextpress/blocks";
import type { ColumnsAttributes } from "@nextpress/blocks/blocks/columns";

export function ColumnsEdit({
  attributes,
  setAttributes,
  isSelected,
  children,
}: BlockEditProps<ColumnsAttributes>) {
  const gapValues = { none: "0", sm: "0.5rem", md: "1rem", lg: "2rem" };

  return (
    <div className="np-edit-columns">
      {isSelected && (
        <div className="np-edit-controls">
          <label>
            Columns:
            <input
              type="number"
              min={1}
              max={6}
              value={attributes.columns}
              onChange={(e) =>
                setAttributes({ columns: parseInt(e.target.value, 10) })
              }
            />
          </label>
          <select
            value={attributes.gap}
            onChange={(e) =>
              setAttributes({ gap: e.target.value as ColumnsAttributes["gap"] })
            }
          >
            <option value="none">No gap</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${attributes.columns}, 1fr)`,
          gap: gapValues[attributes.gap],
          minHeight: "100px",
          border: "1px dashed #ccc",
          padding: "0.5rem",
        }}
      >
        {children ?? (
          <p style={{ color: "#999", gridColumn: "1 / -1", textAlign: "center" }}>
            Add blocks inside this column layout
          </p>
        )}
      </div>
    </div>
  );
}
