/**
 * Hook Registry — Re-exports and convenience functions.
 *
 * This is the public API for the hook system.
 * Plugins and core code import from here.
 */

export { hooks } from "./hook-engine";
export type {
  HookRegistry,
  HookName,
  HookArgs,
  HookReturn,
  HookHandler,
  ContentSavePayload,
  AdminMenuItem,
  SidebarPanel,
} from "./hook-types";
