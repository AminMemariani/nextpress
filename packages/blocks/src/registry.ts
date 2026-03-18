/**
 * Block Registry
 *
 * Global map of block type → BlockDefinition. Shared by editor and renderer.
 *
 * Registration order:
 *   1. Core blocks register at module load (import side-effect)
 *   2. Theme blocks register at theme activation (override render components)
 *   3. Plugin blocks register at plugin activation
 *
 * Thread-safety: This is a module-scoped singleton. In Next.js, server
 * components share one registry per process. The registry is populated
 * once at startup and then read-only during request handling.
 */

import type { BlockDefinition } from "./types";

const registry = new Map<string, BlockDefinition>();

/** Register a block definition. Overwrites if the type already exists. */
export function registerBlock(definition: BlockDefinition): void {
  registry.set(definition.type, definition);
}

/** Unregister a block type (used on plugin deactivation). */
export function unregisterBlock(type: string): void {
  registry.delete(type);
}

/** Get a block definition by type. Returns undefined if not registered. */
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return registry.get(type);
}

/** Get all registered block definitions. */
export function getAllBlockDefinitions(): BlockDefinition[] {
  return Array.from(registry.values());
}

/** Get block definitions filtered by category. */
export function getBlocksByCategory(
  category: string,
): BlockDefinition[] {
  return getAllBlockDefinitions().filter((b) => b.category === category);
}

/** Check if a block type is registered. */
export function isBlockRegistered(type: string): boolean {
  return registry.has(type);
}

/**
 * Override only the render component for a block type.
 * Used by themes to customize block appearance without replacing
 * the entire definition.
 */
export function overrideRenderComponent(
  type: string,
  component: BlockDefinition["renderComponent"],
): void {
  const existing = registry.get(type);
  if (existing) {
    registry.set(type, { ...existing, renderComponent: component });
  }
}

/**
 * Migrate block attributes if the stored version is behind the
 * definition version. Returns migrated attributes and the new version.
 *
 * This is called by the renderer before passing attributes to the
 * component. It is idempotent — if already current, returns as-is.
 */
export function migrateBlockAttributes(
  type: string,
  attributes: Record<string, unknown>,
): Record<string, unknown> {
  const definition = registry.get(type);
  if (!definition || !definition.migrate) return attributes;

  const storedVersion =
    typeof attributes.__version === "number" ? attributes.__version : 1;

  if (storedVersion >= definition.version) return attributes;

  let migrated = { ...attributes };
  for (let v = storedVersion; v < definition.version; v++) {
    migrated = definition.migrate(migrated, v);
  }
  migrated.__version = definition.version;

  return migrated;
}

/**
 * Validate block attributes against the definition's Zod schema.
 * Returns { valid: true, data } or { valid: false, errors }.
 */
export function validateBlockAttributes(
  type: string,
  attributes: Record<string, unknown>,
): { valid: true; data: Record<string, unknown> } | { valid: false; errors: string[] } {
  const definition = registry.get(type);
  if (!definition) {
    return { valid: false, errors: [`Unknown block type: ${type}`] };
  }

  const result = definition.attributesSchema.safeParse(attributes);
  if (result.success) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    ),
  };
}
