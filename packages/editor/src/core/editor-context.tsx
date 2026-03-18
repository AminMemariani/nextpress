"use client";

/**
 * Editor Context — React context + reducer for the block editor.
 *
 * Provides the editor state and dispatch to all block edit components
 * and toolbars. This is the single source of truth for the editor UI.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { BlockData } from "@nextpress/blocks";
import { createBlockData } from "@nextpress/blocks";
import type { EditorState, EditorAction, EditorProps } from "./types";
import { editorReducer, initialEditorState } from "./editor-state";

// ── Context shape ──

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  // Convenience methods (wrap dispatch for cleaner API)
  insertBlock: (type: string, attributes?: Record<string, unknown>, afterId?: string) => void;
  updateBlock: (id: string, attributes: Partial<Record<string, unknown>>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// ── Provider ──

export function EditorProvider({
  initialBlocks,
  onChange,
  children,
}: {
  initialBlocks: BlockData[];
  onChange?: (blocks: BlockData[]) => void;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialEditorState,
    blocks: initialBlocks,
  });

  // Notify parent of block changes (for autosave)
  useEffect(() => {
    if (state.isDirty && onChange) {
      onChange(state.blocks);
    }
  }, [state.blocks, state.isDirty, onChange]);

  const insertBlock = useCallback(
    (type: string, attributes: Record<string, unknown> = {}, afterId?: string) => {
      const block = createBlockData(type, attributes);
      dispatch({ type: "INSERT_BLOCK", block, afterId });
    },
    [],
  );

  const updateBlock = useCallback(
    (id: string, attributes: Partial<Record<string, unknown>>) => {
      dispatch({ type: "UPDATE_BLOCK", id, attributes });
    },
    [],
  );

  const removeBlock = useCallback((id: string) => {
    dispatch({ type: "REMOVE_BLOCK", id });
  }, []);

  const moveBlock = useCallback((id: string, toIndex: number) => {
    dispatch({ type: "MOVE_BLOCK", id, toIndex });
  }, []);

  const selectBlock = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_BLOCK", id });
  }, []);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  const value: EditorContextValue = {
    state,
    dispatch,
    insertBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    selectBlock,
    undo,
    redo,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

// ── Hook ──

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within <EditorProvider>");
  }
  return ctx;
}
