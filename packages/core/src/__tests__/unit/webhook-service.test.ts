import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { webhookService } = await import("../../webhooks/webhook-service");
const { hooks } = await import("../../hooks/hook-engine");

beforeEach(() => {
  resetMockPrisma();
  hooks.reset();
});

describe("webhookService.registerHooks", () => {
  it("registers action handlers", () => {
    webhookService.registerHooks();
    expect(hooks.hasHandlers("content:after_save")).toBe(true);
    expect(hooks.hasHandlers("content:published")).toBe(true);
    expect(hooks.hasHandlers("content:after_delete")).toBe(true);
    expect(hooks.hasHandlers("comment:submitted")).toBe(true);
    expect(hooks.hasHandlers("media:uploaded")).toBe(true);
  });
});

describe("webhookService.getSubscriptions", () => {
  it("returns empty array when no subscriptions", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    const result = await webhookService.getSubscriptions("site-1");
    expect(result).toEqual([]);
  });

  it("returns stored subscriptions", async () => {
    const configs = [
      { url: "https://example.com/hook", secret: "s".repeat(16), events: ["content.created"], active: true },
    ];
    mockPrisma.setting.findUnique.mockResolvedValue({ value: configs });
    const result = await webhookService.getSubscriptions("site-1");
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com/hook");
  });
});

describe("webhookService.saveSubscriptions", () => {
  it("upserts subscriptions", async () => {
    mockPrisma.setting.upsert.mockResolvedValue({});
    const configs = [
      { url: "https://hook.com", secret: "x".repeat(16), events: ["content.created" as const], active: true },
    ];
    await webhookService.saveSubscriptions("site-1", configs);
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });
});

describe("webhookService.dispatch", () => {
  it("does nothing for empty siteId", async () => {
    await webhookService.dispatch("content.created", "", {});
    // Should not call getSubscriptions
    expect(mockPrisma.setting.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when no matching subscriptions", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: [{ url: "https://hook.com", secret: "x".repeat(16), events: ["media.uploaded"], active: true }],
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await webhookService.dispatch("content.created", "site-1", {});
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("delivers to matching subscriptions", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: [{ url: "https://hook.com/wh", secret: "x".repeat(16), events: ["content.created"], active: true }],
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("OK", { status: 200 }));

    await webhookService.dispatch("content.created", "site-1", { id: "e1" });

    // deliver is fire-and-forget, give it a tick
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("webhookService.deliver", () => {
  it("sends POST with correct headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("OK", { status: 200 }));

    const payload = {
      event: "content.created" as const,
      timestamp: new Date().toISOString(),
      siteId: "site-1",
      data: { id: "e1" },
    };

    await webhookService.deliver("https://hook.com/wh", "secret1234567890", payload);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://hook.com/wh",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Webhook-Event": "content.created",
          "User-Agent": "NextPress-Webhook/1.0",
        }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("includes HMAC signature header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("OK", { status: 200 }));

    await webhookService.deliver("https://hook.com", "secret1234567890", {
      event: "content.created",
      timestamp: "",
      siteId: "s",
      data: {},
    });

    const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
    expect(headers["X-Webhook-Signature"]).toMatch(/^sha256=/);
    fetchSpy.mockRestore();
  });

  it("does not retry on 4xx", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Bad Request", { status: 400 }));

    await webhookService.deliver("https://hook.com", "secret1234567890", {
      event: "content.created",
      timestamp: "",
      siteId: "s",
      data: {},
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });
});
