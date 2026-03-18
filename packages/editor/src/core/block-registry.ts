"use client";

/**
 * Editor Block Registry
 *
 * Extends the base registry from packages/blocks with editor-specific
 * concerns: edit components and inspector panels.
 *
 * This registry is CLIENT-ONLY. The render-side registry in packages/blocks
 * is server-safe.
 */

import type { ComponentType } from "react";
import type { z } from "zod";
import type { BlockEditProps } from "@nextpress/blocks";
import type { EditorBlockDefinition } from "./types";

const editorRegistry = new Map<string, EditorBlockDefinition>();

/** Register a block's edit component for the editor */
export function registerEditorBlock(def: EditorBlockDefinition): void {
  editorRegistry.set(def.type, def);
}

/** Get the editor definition (includes edit component) */
export function getEditorBlockDefinition(
  type: string,
): EditorBlockDefinition | undefined {
  return editorRegistry.get(type);
}

/** Get all editor block definitions */
export function getAllEditorBlockDefinitions(): EditorBlockDefinition[] {
  return Array.from(editorRegistry.values());
}

/** Unregister (plugin deactivation) */
export function unregisterEditorBlock(type: string): void {
  editorRegistry.delete(type);
}
