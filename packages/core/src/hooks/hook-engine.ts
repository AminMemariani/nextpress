/**
 * Hook Engine — Runtime execution of actions and filters.
 *
 * This is a singleton. One instance per process.
 * Thread-safe for Next.js: handlers are registered at startup,
 * then read-only during request handling.
 *
 * Actions: all handlers run in priority order. Return values ignored.
 * Filters: handlers run in priority order. Each receives the output of
 *          the previous. The first argument is the "filtered value".
 */

import type { HookName, HookArgs, HookReturn, HookHandler } from "./hook-types";

class HookEngine {
  private handlers = new Map<string, HookHandler[]>();

  /**
   * Register an action handler.
   * Actions are fire-and-forget — all handlers run, returns ignored.
   */
  addAction<K extends HookName>(
    hook: K,
    source: string,
    callback: (...args: HookArgs<K>) => void | Promise<void>,
    priority: number = 10,
  ): void {
    this.add(hook, source, callback as any, priority);
  }

  /**
   * Register a filter handler.
   * Filters transform data. The first argument is piped through handlers.
   */
  addFilter<K extends HookName>(
    hook: K,
    source: string,
    callback: (...args: HookArgs<K>) => HookReturn<K> | Promise<HookReturn<K>>,
    priority: number = 10,
  ): void {
    this.add(hook, source, callback as any, priority);
  }

  /**
   * Execute an action. All handlers run in priority order.
   * Does not return a value. Errors in one handler don't stop others.
   */
  async doAction<K extends HookName>(hook: K, ...args: HookArgs<K>): Promise<void> {
    const handlers = this.getHandlers(hook);
    for (const handler of handlers) {
      try {
        await handler.callback(...args);
      } catch (error) {
        console.error(`[Hook] Error in action "${String(hook)}" from "${handler.source}":`, error);
      }
    }
  }

  /**
   * Apply filters. Each handler receives the output of the previous.
   * The first argument is the value being filtered.
   * Returns the final filtered value.
   */
  async applyFilters<K extends HookName>(
    hook: K,
    ...args: HookArgs<K>
  ): Promise<HookArgs<K>[0]> {
    const handlers = this.getHandlers(hook);
    let filtered = args[0];

    for (const handler of handlers) {
      try {
        const newArgs = [filtered, ...args.slice(1)] as HookArgs<K>;
        const result = await handler.callback(...newArgs);
        if (result !== undefined) {
          filtered = result as HookArgs<K>[0];
        }
      } catch (error) {
        console.error(`[Hook] Error in filter "${String(hook)}" from "${handler.source}":`, error);
      }
    }

    return filtered;
  }

  /**
   * Remove all handlers registered by a specific source (plugin slug).
   * Called when a plugin is deactivated.
   */
  removeBySource(source: string): void {
    for (const [hook, handlers] of this.handlers) {
      this.handlers.set(
        hook,
        handlers.filter((h) => h.source !== source),
      );
    }
  }

  /** Remove all handlers for a specific hook */
  removeAll(hook: HookName): void {
    this.handlers.delete(hook as string);
  }

  /** Check if any handlers are registered for a hook */
  hasHandlers(hook: HookName): boolean {
    return (this.handlers.get(hook as string)?.length ?? 0) > 0;
  }

  /** Get handler count for debugging */
  getHandlerCount(hook?: HookName): number {
    if (hook) return this.handlers.get(hook as string)?.length ?? 0;
    let total = 0;
    for (const handlers of this.handlers.values()) total += handlers.length;
    return total;
  }

  /** Reset all handlers (for testing) */
  reset(): void {
    this.handlers.clear();
  }

  // ── Internal ──

  private add(hook: string | symbol, source: string, callback: Function, priority: number): void {
    const key = hook as string;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    const handlers = this.handlers.get(key)!;
    handlers.push({ callback, priority, source } as HookHandler);
    // Sort by priority (lower = earlier)
    handlers.sort((a, b) => a.priority - b.priority);
  }

  private getHandlers(hook: string | symbol): HookHandler[] {
    return this.handlers.get(hook as string) ?? [];
  }
}

/** Global singleton hook engine */
export const hooks = new HookEngine();
