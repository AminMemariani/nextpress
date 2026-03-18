// ── Main editor component ──
export { NextPressEditor } from "./editor";

// ── Core ──
export { EditorProvider, useEditor } from "./core/editor-context";
export { editorReducer, initialEditorState } from "./core/editor-state";
export {
  registerEditorBlock,
  getEditorBlockDefinition,
  getAllEditorBlockDefinitions,
  unregisterEditorBlock,
} from "./core/block-registry";
export { serializeBlocks, countBlocks } from "./core/serialization";

// ── Types ──
export type {
  EditorBlockDefinition,
  EditorState,
  EditorAction,
  EditorProps,
} from "./core/types";
