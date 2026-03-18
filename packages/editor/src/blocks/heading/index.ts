import { registerEditorBlock } from "../../core/block-registry";
import { headingSchema } from "@nextpress/blocks/blocks/heading";
import { HeadingEdit } from "./edit";

registerEditorBlock({
  type: "core/heading",
  title: "Heading",
  icon: "heading",
  category: "text",
  attributesSchema: headingSchema,
  defaultAttributes: { content: "", level: 2 },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: null,
  editComponent: HeadingEdit,
});
