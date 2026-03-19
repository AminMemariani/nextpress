/**
 * Webhook Service
 *
 * Manages webhook subscriptions and delivers payloads to external URLs.
 *
 * Subscriptions stored in the Settings table:
 *   group: "webhooks", key: "subscriptions", value: WebhookConfig[]
 *
 * Delivery:
 *   - Async fire-and-forget (does not block the request)
 *   - HMAC-SHA256 signature in X-Webhook-Signature header
 *   - 3 retry attempts with exponential backoff
 *   - Timeout: 10 seconds per attempt
 *
 * Integration:
 *   - webhookService.registerHooks() called at startup
 *   - Listens to content/comment/media/user lifecycle hooks
 *   - Maps hook events to webhook events
 *   - Filters subscriptions by event type
 */

import { createHmac } from "crypto";
import { prisma } from "@nextpress/db";
import { hooks } from "../hooks/hook-engine";
import type { WebhookConfig, WebhookEvent, WebhookPayload } from "./webhook-types";

export const webhookService = {
  /**
   * Register hook listeners that trigger webhook deliveries.
   * Called once at server startup.
   */
  registerHooks() {
    hooks.addAction("content:after_save", "webhooks", async (entry) => {
      await this.dispatch("content.updated", entry.siteId, {
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        status: entry.status,
        contentType: entry.contentType.slug,
      });
    });

    hooks.addAction("content:published", "webhooks", async (entry) => {
      await this.dispatch("content.published", entry.siteId, {
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        contentType: entry.contentType.slug,
        publishedAt: entry.publishedAt,
      });
    });

    hooks.addAction("content:after_delete", "webhooks", async (entryId, siteId) => {
      await this.dispatch("content.deleted", siteId, { id: entryId });
    });

    hooks.addAction("comment:submitted", "webhooks", async (commentId, contentEntryId) => {
      await this.dispatch("comment.created", "", { commentId, contentEntryId });
    });

    hooks.addAction("media:uploaded", "webhooks", async (mediaId, siteId) => {
      await this.dispatch("media.uploaded", siteId, { mediaId });
    });
  },

  /**
   * Get all webhook subscriptions for a site.
   */
  async getSubscriptions(siteId: string): Promise<WebhookConfig[]> {
    const setting = await prisma.setting.findUnique({
      where: { siteId_group_key: { siteId, group: "webhooks", key: "subscriptions" } },
    });
    if (!setting) return [];
    return (setting.value as unknown as WebhookConfig[]) ?? [];
  },

  /**
   * Save webhook subscriptions for a site.
   */
  async saveSubscriptions(siteId: string, configs: WebhookConfig[]): Promise<void> {
    await prisma.setting.upsert({
      where: { siteId_group_key: { siteId, group: "webhooks", key: "subscriptions" } },
      update: { value: configs as any },
      create: { siteId, group: "webhooks", key: "subscriptions", value: configs as any },
    });
  },

  /**
   * Dispatch a webhook event to all matching subscriptions.
   * Fire-and-forget — does not throw on delivery failure.
   */
  async dispatch(
    event: WebhookEvent,
    siteId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!siteId) return;

    const subscriptions = await this.getSubscriptions(siteId);
    const matching = subscriptions.filter(
      (s) => s.active && s.events.includes(event),
    );

    if (matching.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      siteId,
      data,
    };

    // Fire all deliveries concurrently (don't await — fire-and-forget)
    for (const sub of matching) {
      this.deliver(sub.url, sub.secret, payload).catch((e) => {
        console.warn(`[Webhook] Delivery failed for ${event} → ${sub.url}:`, e);
      });
    }
  },

  /**
   * Deliver a webhook payload with HMAC signature and retries.
   */
  async deliver(
    url: string,
    secret: string,
    payload: WebhookPayload,
    maxAttempts = 3,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": payload.event,
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Timestamp": payload.timestamp,
            "User-Agent": "NextPress-Webhook/1.0",
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) return;

        // 4xx = don't retry (client error), 5xx = retry
        if (response.status < 500) return;
      } catch (e) {
        if (attempt === maxAttempts) throw e;
      }

      // Exponential backoff: 1s, 4s, 9s
      await new Promise((r) => setTimeout(r, attempt * attempt * 1000));
    }
  },
};
