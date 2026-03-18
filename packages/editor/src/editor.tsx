"use client";

/**
 * <NextPressEditor> — The top-level block editor component.
 *
 * Renders the block list with drag-drop ordering, selection,
 * and a block inserter. Each block delegates to its registered
 * edit component.
 *
 * This is a client component (interactive, stateful).
 * It is only imported in admin routes, never on the public site.
 */

import { useCallback } from "react";
import type { BlockData } from "@nextpress/blocks";
import { createBlockData, getAllBlockDefinitions } from "@nextpress/blocks";
import { EditorProvider, useEditor } from "./core/editor-context";
import { getEditorBlockDefinition } from "./core/block-registry";
import type { EditorProps } from "./core/types";

export function NextPressEditor(props: EditorProps) {
  return (
    <EditorProvider
      initialBlocks={props.initialBlocks}
      onChange={props.onChange}
    >
      <EditorShell {...props} />
    </EditorProvider>
  );
}

function EditorShell({ onSave, readOnly }: EditorProps) {
  const {
    state,
    dispatch,
    insertBlock,
    selectBlock,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditor();

  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(state.blocks);
      dispatch({ type: "MARK_SAVED" });
    }
  }, [onSave, state.blocks, dispatch]);

  return (
    <div className="np-editor">
      {/* ── Toolbar ── */}
      <div className="np-editor-toolbar">
        <button onClick={undo} disabled={!canUndo} title="Undo">
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo} title="Redo">
          Redo
        </button>
        <span className="np-editor-status">
          {state.isDirty ? "Unsaved changes" : "Saved"}
        </span>
        {onSave && (
          <button onClick={handleSave} disabled={!state.isDirty}>
            Save
          </button>
        )}
      </div>

      {/* ── Block list ── */}
      <div
        className="np-editor-canvas"
        onClick={() => selectBlock(null)}
      >
        {state.blocks.map((block, index) => (
          <EditableBlock
            key={block.id}
            block={block}
            index={index}
            readOnly={readOnly ?? false}
          />
        ))}

        {/* ── Empty state / inserter ── */}
        {!readOnly && state.blocks.length === 0 && (
          <div className="np-editor-empty">
            <p>Start writing or choose a block</p>
            <BlockInserterInline />
          </div>
        )}
      </div>

      {/* ── Append block button ── */}
      {!readOnly && (
        <div className="np-editor-append">
          <BlockInserterInline />
        </div>
      )}
    </div>
  );
}

/**
 * Renders a single block in the editor using its registered edit component.
 */
function EditableBlock({
  block,
  index,
  readOnly,
}: {
  block: BlockData;
  index: number;
  readOnly: boolean;
}) {
  const { state, updateBlock, removeBlock, insertBlock, selectBlock, moveBlock } =
    useEditor();

  const isSelected = state.selectedBlockId === block.id;
  const editorDef = getEditorBlockDefinition(block.type);

  const setAttributes = useCallback(
    (partial: Partial<Record<string, unknown>>) => {
      updateBlock(block.id, partial);
    },
    [block.id, updateBlock],
  );

  const insertAfter = useCallback(
    (newBlock: BlockData) => {
      const { insertBlock: ins } = useEditor();
    },
    [],
  );

  if (!editorDef) {
    return (
      <div
        className="np-block-unknown-editor"
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
      >
        <p>Unknown block: {block.type}</p>
        {!readOnly && (
          <button onClick={() => removeBlock(block.id)}>Remove</button>
        )}
      </div>
    );
  }

  const EditComponent = editorDef.editComponent;

  return (
    <div
      className={`np-editor-block ${isSelected ? "np-selected" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
      draggable={!readOnly}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", block.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== block.id) {
          moveBlock(draggedId, index);
        }
      }}
    >
      {/* Block toolbar (shown when selected) */}
      {isSelected && !readOnly && (
        <div className="np-block-toolbar">
          <span className="np-block-type-label">{editorDef.title}</span>
          <button
            onClick={() => moveBlock(block.id, Math.max(0, index - 1))}
            disabled={index === 0}
          >
            ↑
          </button>
          <button
            onClick={() => moveBlock(block.id, index + 1)}
          >
            ↓
          </button>
          <button onClick={() => removeBlock(block.id)}>✕</button>
        </div>
      )}

      <EditComponent
        attributes={block.attributes as any}
        setAttributes={setAttributes}
        isSelected={isSelected}
        insertBlockAfter={(newBlock) =>
          insertBlock(newBlock.type, newBlock.attributes, block.id)
        }
        removeSelf={() => removeBlock(block.id)}
        clientId={block.id}
      />
    </div>
  );
}

/**
 * Simple inline block inserter — shows available block types.
 */
function BlockInserterInline() {
  const { insertBlock } = useEditor();
  const definitions = getAllBlockDefinitions();

  return (
    <div className="np-block-inserter">
      <select
        onChange={(e) => {
          if (e.target.value) {
            const def = definitions.find((d) => d.type === e.target.value);
            if (def) {
              insertBlock(def.type, { ...def.defaultAttributes });
            }
            e.target.value = "";
          }
        }}
        defaultValue=""
      >
        <option value="" disabled>
          + Add block
        </option>
        {definitions.map((def) => (
          <option key={def.type} value={def.type}>
            {def.title}
          </option>
        ))}
      </select>
    </div>
  );
}
