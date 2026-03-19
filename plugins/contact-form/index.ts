import { z } from "zod";
import type { PluginDefinition } from "@nextpress/core/plugin/plugin-types";
import type { PluginContext } from "@nextpress/core/plugin/plugin-context";

/**
 * Contact Form Plugin
 *
 * Demonstrates:
 *   - Registering a custom block (form block)
 *   - Registering a custom content type (form_submission)
 *   - Registering custom fields on the content type
 *   - Registering API routes (form submission endpoint)
 *   - Registering admin pages (submissions view)
 *   - Using hooks (send notification on submission)
 */

const contactFormSchema = z.object({
  formTitle: z.string().default("Contact Us"),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(["text", "email", "textarea"]),
    label: z.string(),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
  })).default([
    { name: "name", type: "text", label: "Name", required: true },
    { name: "email", type: "email", label: "Email", required: true },
    { name: "message", type: "textarea", label: "Message", required: true },
  ]),
  submitLabel: z.string().default("Send Message"),
});

const contactForm: PluginDefinition = {
  slug: "contact-form",

  async onActivate(ctx: PluginContext) {
    // ── Register the contact form block ──
    ctx.blocks.register({
      type: "plugin/contact-form",
      title: "Contact Form",
      description: "A customizable contact form",
      icon: "mail",
      category: "widgets",
      keywords: ["form", "contact", "email"],
      attributesSchema: contactFormSchema,
      defaultAttributes: {
        formTitle: "Contact Us",
        fields: [
          { name: "name", type: "text" as const, label: "Name", required: true },
          { name: "email", type: "email" as const, label: "Email", required: true },
          { name: "message", type: "textarea" as const, label: "Message", required: true },
        ],
        submitLabel: "Send Message",
      },
      version: 1,
      allowsInnerBlocks: false,
      renderComponent: null, // Will be loaded from components/
    });

    // ── Register form_submission content type ──
    try {
      await ctx.content.registerType({
        slug: "form_submission",
        nameSingular: "Form Submission",
        namePlural: "Form Submissions",
        description: "Contact form submissions",
        hasArchive: false,
        isPublic: false,
        menuIcon: "inbox",
        menuPosition: 25,
        supports: ["title", "custom-fields"],
      });
    } catch {
      // Type may already exist from a previous activation
    }

    // ── Register fields on form_submission ──
    try {
      await ctx.content.registerFields("form_submission", [
        { key: "sender_name", name: "Sender Name", fieldType: "TEXT" },
        { key: "sender_email", name: "Sender Email", fieldType: "EMAIL" },
        { key: "message_body", name: "Message", fieldType: "TEXTAREA" },
        { key: "form_source", name: "Source Page", fieldType: "URL" },
        { key: "submission_ip", name: "IP Address", fieldType: "TEXT" },
        { key: "is_read", name: "Read", fieldType: "BOOLEAN", defaultValue: false },
      ]);
    } catch {
      // Fields may already exist
    }

    // ── Register form submission API endpoint ──
    ctx.api.registerRoute("POST", "/submit", async (req: Request) => {
      try {
        const body = await req.json();
        const settings = await ctx.settings.get();

        // Validate required fields
        if (!body.name || !body.email || !body.message) {
          return new Response(
            JSON.stringify({ error: "All fields are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Send notification email (placeholder)
        if (settings.enableNotifications && settings.recipientEmail) {
          console.log(`[Contact Form] New submission from ${body.email} → ${settings.recipientEmail}`);
        }

        const successMessage = (settings.successMessage as string) ?? "Thank you!";
        return new Response(
          JSON.stringify({ success: true, message: successMessage }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid submission" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    });

    // ── Register admin page ──
    ctx.admin.registerPage({
      slug: "form-submissions",
      label: "Form Submissions",
      href: "/admin/form_submission",
      capability: "manage_form_submissions",
    });

    // ── Hook: log form submissions ──
    ctx.hooks.addAction("content:after_save", async (entry) => {
      if (entry.contentType.slug === "form_submission") {
        console.log(`[Contact Form] New submission: ${entry.title}`);
      }
    });
  },

  async onUninstall(ctx: PluginContext) {
    console.log("[Contact Form] Uninstalling — submission data will be preserved in form_submission content type");
  },
};

export default contactForm;
