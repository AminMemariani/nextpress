/**
 * Editor State — Immutable reducer pattern.
 *
 * All state changes go through this reducer. This makes undo/redo
 * trivial (push previous state to history) and ensures the UI always
 * reflects the latest state.
 *
 * The history is capped at 50 entries to bound memory usage.
 */

import type { BlockData } from "@nextpress/blocks";
import type { EditorState, EditorAction } from "./types";

const MAX_HISTORY = 50;

export const initialEditorState: EditorState = {
  blocks: [],
  selectedBlockId: null,
  history: { past: [], future: [] },
  isDirty: false,
};

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "SET_BLOCKS":
      return {
        ...state,
        blocks: action.blocks,
        isDirty: false,
        history: { past: [], future: [] },
      };

    case "INSERT_BLOCK": {
      const newBlocks = [...state.blocks];
      if (action.afterId) {
        const index = newBlocks.findIndex((b) => b.id === action.afterId);
        newBlocks.splice(index + 1, 0, action.block);
      } else {
        newBlocks.push(action.block);
      }
      return pushHistory(state, {
        ...state,
        blocks: newBlocks,
        selectedBlockId: action.block.id,
        isDirty: true,
      });
    }

    case "UPDATE_BLOCK":
      return pushHistory(state, {
        ...state,
        blocks: updateBlockInTree(state.blocks, action.id, (block) => ({
          ...block,
          attributes: { ...block.attributes, ...action.attributes },
        })),
        isDirty: true,
      });

    case "REMOVE_BLOCK": {
      const filtered = removeBlockFromTree(state.blocks, action.id);
      return pushHistory(state, {
        ...state,
        blocks: filtered,
        selectedBlockId:
          state.selectedBlockId === action.id ? null : state.selectedBlockId,
        isDirty: true,
      });
    }

    case "MOVE_BLOCK": {
      const blockIndex = state.blocks.findIndex((b) => b.id === action.id);
      if (blockIndex === -1) return state;
      const newBlocks = [...state.blocks];
      const [moved] = newBlocks.splice(blockIndex, 1) as [BlockData];
      newBlocks.splice(action.toIndex, 0, moved);
      return pushHistory(state, {
        ...state,
        blocks: newBlocks,
        isDirty: true,
      });
    }

    case "SELECT_BLOCK":
      return { ...state, selectedBlockId: action.id };

    case "UNDO": {
      if (state.history.past.length === 0) return state;
      const past = [...state.history.past];
      const previous = past.pop()!;
      return {
        ...state,
        blocks: previous,
        history: {
          past,
          future: [state.blocks, ...state.history.future].slice(0, MAX_HISTORY),
        },
        isDirty: true,
      };
    }

    case "REDO": {
      if (state.history.future.length === 0) return state;
      const future = [...state.history.future];
      const next = future.shift()!;
      return {
        ...state,
        blocks: next,
        history: {
          past: [...state.history.past, state.blocks].slice(-MAX_HISTORY),
          future,
        },
        isDirty: true,
      };
    }

    case "MARK_SAVED":
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ── Tree manipulation helpers ──

function pushHistory(
  oldState: EditorState,
  newState: EditorState,
): EditorState {
  return {
    ...newState,
    history: {
      past: [...oldState.history.past, oldState.blocks].slice(-MAX_HISTORY),
      future: [], // Clear redo stack on new action
    },
  };
}

/** Recursively update a block by ID in a tree */
function updateBlockInTree(
  blocks: BlockData[],
  id: string,
  updater: (block: BlockData) => BlockData,
): BlockData[] {
  return blocks.map((block) => {
    if (block.id === id) return updater(block);
    if (block.innerBlocks?.length) {
      return {
        ...block,
        innerBlocks: updateBlockInTree(block.innerBlocks, id, updater),
      };
    }
    return block;
  });
}

/** Recursively remove a block by ID from a tree */
function removeBlockFromTree(
  blocks: BlockData[],
  id: string,
): BlockData[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.innerBlocks?.length) {
        return {
          ...block,
          innerBlocks: removeBlockFromTree(block.innerBlocks, id),
        };
      }
      return block;
    });
}
