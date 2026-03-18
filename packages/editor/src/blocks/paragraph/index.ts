import { registerEditorBlock } from "../../core/block-registry";
import { paragraphSchema } from "@nextpress/blocks/blocks/paragraph";
import { ParagraphEdit } from "./edit";

registerEditorBlock({
  type: "core/paragraph",
  title: "Paragraph",
  icon: "type",
  category: "text",
  attributesSchema: paragraphSchema,
  defaultAttributes: { content: "", dropCap: false },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: null, // render-side registered in packages/blocks
  editComponent: ParagraphEdit,
});
