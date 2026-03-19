/**
 * Webhook Types
 *
 * Webhook events map 1:1 to hook system actions.
 * When a hook fires, the webhook service checks if any
 * webhook subscriptions match and enqueues HTTP deliveries.
 */

import { z } from "zod";

export const WEBHOOK_EVENTS = [
  "content.created",
  "content.updated",
  "content.published",
  "content.deleted",
  "content.status_changed",
  "comment.created",
  "comment.approved",
  "media.uploaded",
  "user.registered",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const webhookConfigSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(16).max(256),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  active: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

export interface WebhookDelivery {
  id: string;
  event: WebhookEvent;
  url: string;
  payload: Record<string, unknown>;
  status: "pending" | "success" | "failed";
  statusCode?: number;
  error?: string;
  attempts: number;
  createdAt: Date;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  siteId: string;
  data: Record<string, unknown>;
}
