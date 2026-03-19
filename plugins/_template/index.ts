import type { PluginDefinition } from "@nextpress/core/plugin/plugin-types";
import type { PluginContext } from "@nextpress/core/plugin/plugin-context";

const myPlugin: PluginDefinition = {
  slug: "my-plugin",

  async onActivate(ctx: PluginContext) {
    // Register hooks, content types, fields, blocks, admin pages, API routes
    // See SEO Toolkit and Contact Form plugins for examples.
  },

  async onDeactivate(ctx: PluginContext) {
    // Optional cleanup (hooks are auto-removed)
  },

  async onUninstall(ctx: PluginContext) {
    // Clean up DB data
  },
};

export default myPlugin;
