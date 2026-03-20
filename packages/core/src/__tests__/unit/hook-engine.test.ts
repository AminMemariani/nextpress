import { describe, it, expect, beforeEach, vi } from "vitest";
import { hooks } from "../../hooks/hook-engine";

beforeEach(() => {
  hooks.reset();
});

describe("addAction / doAction", () => {
  it("calls registered action handler", async () => {
    const fn = vi.fn();
    hooks.addAction("content:after_save", "test", fn);
    await hooks.doAction("content:after_save", {} as any);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("passes arguments to handler", async () => {
    const fn = vi.fn();
    hooks.addAction("content:before_delete", "test", fn);
    await hooks.doAction("content:before_delete", "entry-1", "site-1");
    expect(fn).toHaveBeenCalledWith("entry-1", "site-1");
  });

  it("calls multiple handlers in order", async () => {
    const order: number[] = [];
    hooks.addAction("content:after_save", "a", () => { order.push(1); });
    hooks.addAction("content:after_save", "b", () => { order.push(2); });
    await hooks.doAction("content:after_save", {} as any);
    expect(order).toEqual([1, 2]);
  });

  it("respects priority ordering (lower runs first)", async () => {
    const order: string[] = [];
    hooks.addAction("content:after_save", "high", () => { order.push("high"); }, 20);
    hooks.addAction("content:after_save", "low", () => { order.push("low"); }, 5);
    await hooks.doAction("content:after_save", {} as any);
    expect(order).toEqual(["low", "high"]);
  });

  it("continues on handler error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fn = vi.fn();
    hooks.addAction("content:after_save", "bad", () => { throw new Error("boom"); });
    hooks.addAction("content:after_save", "good", fn);
    await hooks.doAction("content:after_save", {} as any);
    expect(fn).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  it("handles async handlers", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    hooks.addAction("content:after_save", "async", fn);
    await hooks.doAction("content:after_save", {} as any);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("no-ops when no handlers registered", async () => {
    await expect(hooks.doAction("content:after_save", {} as any)).resolves.toBeUndefined();
  });
});

describe("addFilter / applyFilters", () => {
  it("transforms value through single filter", async () => {
    hooks.addFilter("render:excerpt", "test", (excerpt: string) => excerpt.toUpperCase());
    const result = await hooks.applyFilters("render:excerpt", "hello" as any, {} as any);
    expect(result).toBe("HELLO");
  });

  it("pipes value through multiple filters", async () => {
    hooks.addFilter("render:excerpt", "a", (s: string) => s + " world");
    hooks.addFilter("render:excerpt", "b", (s: string) => s + "!");
    const result = await hooks.applyFilters("render:excerpt", "hello" as any, {} as any);
    expect(result).toBe("hello world!");
  });

  it("respects priority ordering", async () => {
    hooks.addFilter("render:excerpt", "second", (s: string) => s + "2", 20);
    hooks.addFilter("render:excerpt", "first", (s: string) => s + "1", 5);
    const result = await hooks.applyFilters("render:excerpt", "" as any, {} as any);
    expect(result).toBe("12");
  });

  it("ignores undefined return (keeps previous value)", async () => {
    hooks.addFilter("render:excerpt", "noop", () => undefined as any);
    const result = await hooks.applyFilters("render:excerpt", "keep" as any, {} as any);
    expect(result).toBe("keep");
  });

  it("returns original value when no filters registered", async () => {
    const result = await hooks.applyFilters("render:excerpt", "original" as any, {} as any);
    expect(result).toBe("original");
  });

  it("continues on filter error and keeps previous value", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    hooks.addFilter("render:excerpt", "bad", () => { throw new Error("boom"); });
    hooks.addFilter("render:excerpt", "good", (s: string) => s + "!");
    const result = await hooks.applyFilters("render:excerpt", "hello" as any, {} as any);
    expect(result).toBe("hello!");
    consoleSpy.mockRestore();
  });
});

describe("removeBySource", () => {
  it("removes all handlers from a source", async () => {
    hooks.addAction("content:after_save", "plugin-a", vi.fn());
    hooks.addAction("content:before_delete", "plugin-a", vi.fn());
    hooks.addAction("content:after_save", "plugin-b", vi.fn());
    hooks.removeBySource("plugin-a");
    expect(hooks.getHandlerCount("content:after_save")).toBe(1);
    expect(hooks.getHandlerCount("content:before_delete")).toBe(0);
  });
});

describe("removeAll", () => {
  it("removes all handlers for a hook", () => {
    hooks.addAction("content:after_save", "a", vi.fn());
    hooks.addAction("content:after_save", "b", vi.fn());
    hooks.removeAll("content:after_save");
    expect(hooks.hasHandlers("content:after_save")).toBe(false);
  });
});

describe("hasHandlers", () => {
  it("returns false when no handlers", () => {
    expect(hooks.hasHandlers("content:after_save")).toBe(false);
  });

  it("returns true when handler exists", () => {
    hooks.addAction("content:after_save", "test", vi.fn());
    expect(hooks.hasHandlers("content:after_save")).toBe(true);
  });
});

describe("getHandlerCount", () => {
  it("returns 0 for unregistered hook", () => {
    expect(hooks.getHandlerCount("content:after_save")).toBe(0);
  });

  it("returns count for specific hook", () => {
    hooks.addAction("content:after_save", "a", vi.fn());
    hooks.addAction("content:after_save", "b", vi.fn());
    expect(hooks.getHandlerCount("content:after_save")).toBe(2);
  });

  it("returns total count when no hook specified", () => {
    hooks.addAction("content:after_save", "a", vi.fn());
    hooks.addAction("content:before_delete", "b", vi.fn());
    expect(hooks.getHandlerCount()).toBe(2);
  });
});

describe("reset", () => {
  it("clears all handlers", () => {
    hooks.addAction("content:after_save", "a", vi.fn());
    hooks.addFilter("render:excerpt", "b", vi.fn() as any);
    hooks.reset();
    expect(hooks.getHandlerCount()).toBe(0);
  });
});
