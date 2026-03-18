/**
 * Block Serialization
 *
 * Validates the entire block tree before saving to the DB.
 * Strips unknown attributes, applies defaults, runs migrations.
 *
 * This is the last checkpoint before block data enters the database.
 */

import type { BlockData } from "@nextpress/blocks";
import {
  getBlockDefinition,
  migrateBlockAttributes,
  validateBlockAttributes,
} from "@nextpress/blocks";

export interface SerializationResult {
  valid: boolean;
  blocks: BlockData[];
  errors: Array<{ blockId: string; blockType: string; errors: string[] }>;
}

/**
 * Validate and sanitize a block tree before saving.
 *
 * For each block:
 *   1. Run migration (if version is behind)
 *   2. Validate attributes against Zod schema
 *   3. Strip any extra properties not in the schema
 *   4. Recurse into innerBlocks
 *
 * Returns the cleaned block tree + any validation errors.
 * If there are errors, the caller should reject the save.
 */
export function serializeBlocks(blocks: BlockData[]): SerializationResult {
  const errors: SerializationResult["errors"] = [];
  const cleaned: BlockData[] = [];

  for (const block of blocks) {
    const result = serializeOneBlock(block, errors);
    if (result) cleaned.push(result);
  }

  return {
    valid: errors.length === 0,
    blocks: cleaned,
    errors,
  };
}

function serializeOneBlock(
  block: BlockData,
  errors: SerializationResult["errors"],
): BlockData | null {
  const definition = getBlockDefinition(block.type);

  // Unknown block type — preserve as-is (might be from a deactivated plugin).
  // Don't validate, don't strip — just pass through so re-activating the
  // plugin restores the block.
  if (!definition) {
    return block;
  }

  // Migrate
  const migrated = migrateBlockAttributes(block.type, block.attributes);

  // Validate
  const validation = validateBlockAttributes(block.type, migrated);
  if (!validation.valid) {
    errors.push({
      blockId: block.id,
      blockType: block.type,
      errors: validation.errors,
    });
    // Still include the block (with original attributes) so the user
    // can fix it in the editor. Don't silently drop content.
    return { ...block, attributes: migrated };
  }

  // Recurse into inner blocks
  const innerBlocks: BlockData[] = [];
  if (block.innerBlocks?.length && definition.allowsInnerBlocks) {
    for (const inner of block.innerBlocks) {
      const result = serializeOneBlock(inner, errors);
      if (result) innerBlocks.push(result);
    }
  }

  return {
    id: block.id,
    type: block.type,
    attributes: { ...validation.data, __version: definition.version },
    innerBlocks,
  };
}

/**
 * Deep-count all blocks in a tree (for analytics/limits).
 */
export function countBlocks(blocks: BlockData[]): number {
  let count = 0;
  for (const block of blocks) {
    count++;
    if (block.innerBlocks?.length) {
      count += countBlocks(block.innerBlocks);
    }
  }
  return count;
}
