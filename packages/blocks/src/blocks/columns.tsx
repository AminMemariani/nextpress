import { z } from "zod";
import { registerBlock } from "../registry";
import type { BlockRenderProps } from "../types";

export const columnsSchema = z.object({
  columns: z.number().int().min(1).max(6).default(2),
  gap: z.enum(["none", "sm", "md", "lg"]).default("md"),
  verticalAlign: z.enum(["top", "center", "bottom", "stretch"]).default("top"),
});

export type ColumnsAttributes = z.infer<typeof columnsSchema>;

/**
 * Columns block — a container that renders inner blocks in a CSS grid.
 *
 * Inner blocks are the column contents. Each inner block becomes one
 * column. The `columns` attribute controls the grid template.
 *
 * This is the simplest implementation of nested blocks:
 * the renderer passes `children` (already-rendered inner blocks) as a prop.
 */
function ColumnsBlock({
  attributes,
  children,
  className,
}: BlockRenderProps<ColumnsAttributes>) {
  const gapValues = { none: "0", sm: "0.5rem", md: "1rem", lg: "2rem" };
  const alignValues = {
    top: "start",
    center: "center",
    bottom: "end",
    stretch: "stretch",
  };

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${attributes.columns}, 1fr)`,
        gap: gapValues[attributes.gap],
        alignItems: alignValues[attributes.verticalAlign],
      }}
    >
      {children}
    </div>
  );
}

registerBlock({
  type: "core/columns",
  title: "Columns",
  description: "Multi-column layout",
  icon: "columns",
  category: "layout",
  keywords: ["columns", "grid", "layout", "row"],
  attributesSchema: columnsSchema,
  defaultAttributes: { columns: 2, gap: "md", verticalAlign: "top" },
  version: 1,
  allowsInnerBlocks: true,
  source: "core",
  renderComponent: ColumnsBlock,
});
