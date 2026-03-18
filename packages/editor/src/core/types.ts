/**
 * Editor-specific types.
 *
 * These extend the base block types from packages/blocks with
 * editor-only concerns: edit components, selection state, undo history.
 */

import type { ComponentType } from "react";
import type { z } from "zod";
import type {
  BlockDefinition,
  BlockEditProps,
  BlockData,
} from "@nextpress/blocks";

/**
 * Editor-side block registration. Adds the edit component to the
 * base BlockDefinition. Registered separately so the public site
 * never imports editor UI code.
 */
export interface EditorBlockDefinition<
  TSchema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> extends BlockDefinition<TSchema> {
  /** Client-side edit component shown in the admin editor */
  editComponent: ComponentType<BlockEditProps<z.infer<TSchema>>>;
  /** Optional inspector panel for the sidebar */
  inspectorComponent?: ComponentType<BlockEditProps<z.infer<TSchema>>>;
}

/** The editor's internal state */
export interface EditorState {
  /** The block tree being edited */
  blocks: BlockData[];
  /** ID of the currently selected block (null = none) */
  selectedBlockId: string | null;
  /** Undo/redo history */
  history: {
    past: BlockData[][];
    future: BlockData[][];
  };
  /** Has the content been modified since last save? */
  isDirty: boolean;
}

/** Actions the editor can perform */
export type EditorAction =
  | { type: "SET_BLOCKS"; blocks: BlockData[] }
  | { type: "INSERT_BLOCK"; block: BlockData; afterId?: string }
  | { type: "UPDATE_BLOCK"; id: string; attributes: Partial<Record<string, unknown>> }
  | { type: "REMOVE_BLOCK"; id: string }
  | { type: "MOVE_BLOCK"; id: string; toIndex: number }
  | { type: "SELECT_BLOCK"; id: string | null }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "MARK_SAVED" };

/** Props for the top-level <NextPressEditor> component */
export interface EditorProps {
  /** Initial block data (from the content entry) */
  initialBlocks: BlockData[];
  /** Called when blocks change (for autosave) */
  onChange?: (blocks: BlockData[]) => void;
  /** Called on explicit save */
  onSave?: (blocks: BlockData[]) => Promise<void>;
  /** Content type slug (for block restrictions) */
  contentType?: string;
  /** Whether the editor is in read-only preview mode */
  readOnly?: boolean;
}
