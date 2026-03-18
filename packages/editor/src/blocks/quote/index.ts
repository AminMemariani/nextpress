import { registerEditorBlock } from "../../core/block-registry";
import { quoteSchema } from "@nextpress/blocks/blocks/quote";
import { QuoteEdit } from "./edit";

registerEditorBlock({
  type: "core/quote",
  title: "Quote",
  icon: "quote",
  category: "text",
  attributesSchema: quoteSchema,
  defaultAttributes: { content: "", style: "default" },
  version: 1,
  allowsInnerBlocks: false,
  source: "core",
  renderComponent: null,
  editComponent: QuoteEdit,
});
