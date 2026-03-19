/**
 * Block Renderer — Server Component
 *
 * Recursively renders a BlockData[] tree into React elements.
 * Used by the public site's catch-all route to render content.
 *
 * Security:
 *   - Every block's attributes are validated against its Zod schema
 *     before being passed to the render component.
 *   - Unknown block types render a safe fallback (not raw attributes).
 *   - Attributes that fail validation render an error placeholder,
 *     not the malformed data.
 *   - Migration runs before validation, so old data is upgraded first.
 *
 * Performance:
 *   - No state, no effects, no client JS. Pure server rendering.
 *   - The registry lookup is O(1) per block.
 *   - Inner blocks recurse naturally (React's component tree handles depth).
 */

import type { BlockData } from "./types";
import {
  getBlockDefinition,
  migrateBlockAttributes,
  validateBlockAttributes,
} from "./registry";

interface BlockRendererProps {
  /** The array of blocks to render (from ContentEntry.blocks) */
  blocks: BlockData[];
  /** Optional CSS class for the wrapper */
  className?: string;
}

/**
 * Top-level renderer. Wraps the block tree in a container div.
 */
export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (!blocks?.length) return null;

  return (
    <div className={className ?? "np-blocks"}>
      {blocks.map((block) => (
        <SingleBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

/**
 * Render a single block + its inner blocks recursively.
 */
function SingleBlockRenderer({ block }: { block: BlockData }) {
  const definition = getBlockDefinition(block.type);

  // Unknown block type — safe fallback
  if (!definition) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="np-block-unknown" data-type={block.type}>
          <p>Unknown block type: {block.type}</p>
        </div>
      );
    }
    return null; // Silently skip in production
  }

  // No render component (editor-only block)
  if (!definition.renderComponent) return null;

  // Migrate old attributes to current version
  const migrated = migrateBlockAttributes(block.type, block.attributes);

  // Validate attributes against schema
  const validation = validateBlockAttributes(block.type, migrated);
  if (!validation.valid) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="np-block-error" data-type={block.type}>
          <p>Block validation failed: {block.type}</p>
          <ul>
            {validation.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  }

  const Component = definition.renderComponent;

  // Render inner blocks recursively
  const innerContent =
    definition.allowsInnerBlocks && block.innerBlocks?.length ? (
      <BlockRenderer blocks={block.innerBlocks} />
    ) : undefined;

  return (
    <Component
      attributes={validation.data}
      blockData={block}
      className={`np-block np-block-${block.type.replace("/", "-")}`}
    >
      {innerContent}
    </Component>
  );
}
